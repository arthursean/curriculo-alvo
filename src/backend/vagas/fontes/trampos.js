import "server-only";
import { contem } from "@/shared/texto";
import { buscarJson } from "../http";

// Trampos.co: API pública (trampos.co/api/oportunidades.json), sem chave. Limitações da própria API:
// só as vagas mais recentes (10 por página), sem busca, sem descrição e sem cidade. Por isso
// trazemos as últimas páginas, filtramos pelo título aqui, e a vaga não passa em filtro de local.
export const nome = "Trampos.co";
const PAGINAS = 8;

let cache = { em: 0, promessa: null };
function recentes() {
  if (!cache.promessa || Date.now() - cache.em > 10 * 60_000) {
    const paginas = Array.from({ length: PAGINAS }, (_, i) =>
      buscarJson(`https://trampos.co/api/oportunidades.json?page=${i + 1}`).catch(() => []));
    cache = {
      em: Date.now(),
      promessa: Promise.all(paginas).then((ps) => {
        const todas = ps.flat();
        if (!todas.length) throw new Error("Trampos.co indisponível");
        return todas;
      }),
    };
    cache.promessa.catch(() => { cache = { em: 0, promessa: null }; });
  }
  return cache.promessa;
}

// "2026-11-04 12:34:16 -0300" -> ISO
function data(texto) {
  const m = String(texto || "").match(/^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2}) ([+-]\d{2})(\d{2})$/);
  return m ? new Date(`${m[1]}T${m[2]}${m[3]}:${m[4]}`).toISOString() : new Date().toISOString();
}

export async function buscar(q) {
  const termos = q.split(/[,\s]+/).filter((t) => t.length > 1);
  return (await recentes())
    .map(({ opportunity: o }) => o)
    .filter((o) => o?.id && termos.every((t) => contem(o.name, t)))
    .map((o) => ({
      id: `trampos-${o.id}`,
      titulo: o.name,
      empresa: o.company_name || "Empresa confidencial",
      local: "",
      descricao: "",
      url: o.permalink,
      publicadaEm: data(o.published_at),
      categoria: "",
      salario: null,
      tags: [],
      fonte: nome,
    }));
}
