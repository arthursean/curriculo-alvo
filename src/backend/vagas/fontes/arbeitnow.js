import "server-only";
import { contem } from "@/shared/texto";
import { buscarJson } from "../http";

// Arbeitnow: vagas internacionais (remotas e presenciais), sem chave. A API não tem busca:
// trazemos a lista recente e filtramos pelas palavras-chave aqui.
export const nome = "Arbeitnow";

function bateComBusca(v, q) {
  const termos = q.split(/[,\s]+/).filter((t) => t.length > 1);
  const texto = `${v.titulo} ${v.tags.join(" ")} ${v.descricao}`;
  return termos.every((t) => contem(texto, t));
}

export async function buscar(q) {
  const data = await buscarJson("https://www.arbeitnow.com/api/job-board-api");
  return (data.data || [])
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
      remoto: j.remote,
      fonte: nome,
    }))
    .filter((v) => bateComBusca(v, q));
}
