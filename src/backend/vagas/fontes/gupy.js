import "server-only";
import { buscarJson } from "../http";
import { ESTADOS } from "@/shared/estados";

// Gupy: portal público de vagas (portal.gupy.io), sem chave. API não oficial: pode mudar sem aviso.
const MODALIDADE = { remote: "remoto", hybrid: "hibrido", "on-site": "presencial" };
const NIVEL = { vacancy_type_internship: "estagio", vacancy_type_trainee: "estagio", vacancy_type_apprentice: "estagio", vacancy_type_junior_apprentice: "estagio" };
const NOME_UF = Object.fromEntries(ESTADOS.map((e) => [e.uf, e.nome]));
const POR_PAGINA = 100; // máximo aceito pela API
const CACHE_MIN = 10;

export const nome = "Gupy";

const pagina = (params, p) =>
  buscarJson(`https://portal.gupy.io/api/job-search/jobs?${params}&limit=${POR_PAGINA}&offset=${p * POR_PAGINA}`, { cacheMin: CACHE_MIN })
    .then((d) => d.data || []);

// Pede páginas em lotes paralelos até uma vir incompleta (acabou) ou até `maxPaginas`.
// A API devolve as mais recentes primeiro.
async function paginar(params, maxPaginas, lote = 1) {
  const out = [];
  for (let p = 0; p < maxPaginas; p += lote) {
    const idx = Array.from({ length: Math.min(lote, maxPaginas - p) }, (_, i) => p + i);
    const paginas = await Promise.all(idx.map((i) => pagina(params, i)));
    for (const l of paginas) out.push(...l);
    if (paginas.some((l) => l.length < POR_PAGINA)) break;
  }
  return out;
}

function mapear(j) {
  return {
    id: `gupy-${j.id}`,
    titulo: j.name?.trim(),
    empresa: j.careerPageName || "Empresa confidencial",
    local: j.workplaceType === "remote" ? "Remoto" : [j.city, j.state].filter(Boolean).join(", ") || "Brasil",
    descricao: j.description,
    url: j.jobUrl,
    publicadaEm: j.publishedDate,
    categoria: "",
    salario: null,
    tags: [],
    modalidade: MODALIDADE[j.workplaceType],
    nivel: NIVEL[j.type],
    fonte: nome,
  };
}

async function juntar(consultas) {
  const r = await Promise.allSettled(consultas);
  if (r.every((x) => x.status === "rejected")) throw r[0].reason;
  return r.filter((x) => x.status === "fulfilled").flatMap((x) => x.value).map(mapear);
}

// Por palavra-chave. Com local escolhido: as vagas de cada estado do raio (filtro da própria
// Gupy) e, à parte, as remotas. Sem local: as primeiras páginas do Brasil todo.
// Com `regiaoCoberta` (a lista completa da região já veio por `todas`), só busca as remotas.
export async function buscar(q, { ufs = [], paginasRemotas = 2, regiaoCoberta = false } = {}) {
  const base = `jobName=${encodeURIComponent(q)}`;
  if (regiaoCoberta) return juntar([paginar(`${base}&workplaceType=remote`, paginasRemotas)]);
  return juntar(ufs.length
    ? [...ufs.filter((uf) => NOME_UF[uf]).map((uf) => paginar(`${base}&state=${encodeURIComponent(NOME_UF[uf])}`, 3)), paginar(`${base}&workplaceType=remote`, paginasRemotas)]
    : [paginar(base, 3)]);
}

// Todas as vagas dos estados (sem palavra-chave), para a busca por área: a área é decidida aqui,
// não por algumas palavras. Até 2.000 por estado (as mais recentes). Sem estado, não se aplica.
export async function todas({ ufs = [] } = {}) {
  if (!ufs.length) return [];
  return juntar(ufs.filter((uf) => NOME_UF[uf]).map((uf) => paginar(`jobName=&state=${encodeURIComponent(NOME_UF[uf])}`, 20, 10)));
}
