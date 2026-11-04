import "server-only";
import { contem } from "@/shared/texto";
import { buscarJson } from "../http";

// Arbeitnow: vagas internacionais (Europa), sem chave. A API não tem busca: trazemos a lista
// recente e filtramos pelas palavras-chave aqui. Público brasileiro: só as remotas.
export const nome = "Arbeitnow";

function bateComBusca(v, q) {
  const termos = q.split(/[,\s]+/).filter((t) => t.length > 1);
  const texto = `${v.titulo} ${v.tags.join(" ")} ${v.descricao}`;
  return termos.every((t) => contem(texto, t));
}

// A lista é a mesma para qualquer termo: guardada por 5 minutos para uma busca com vários termos
// (ex.: busca por área) não baixar tudo de novo a cada termo.
let cache = { em: 0, promessa: null };
function listaRecente() {
  if (!cache.promessa || Date.now() - cache.em > 5 * 60_000) {
    cache = { em: Date.now(), promessa: buscarJson("https://www.arbeitnow.com/api/job-board-api") };
    cache.promessa.catch(() => { cache = { em: 0, promessa: null }; });
  }
  return cache.promessa;
}

export async function buscar(q) {
  const data = await listaRecente();
  return (data.data || [])
    .filter((j) => j.remote)
    .map((j) => ({
      id: `arbeitnow-${j.slug}`,
      titulo: j.title,
      empresa: j.company_name,
      local: j.location || "",
      descricao: j.description,
      url: j.url,
      publicadaEm: new Date(j.created_at * 1000).toISOString(),
      categoria: (j.tags || []).join(", "),
      salario: null,
      tags: [...(j.tags || []), ...(j.job_types || [])],
      remoto: true,
      modalidade: "remoto",
      internacional: true,
      fonte: nome,
    }))
    .filter((v) => bateComBusca(v, q));
}

// Todas as remotas da lista (para a busca por área).
export async function todas() {
  return buscar("");
}
