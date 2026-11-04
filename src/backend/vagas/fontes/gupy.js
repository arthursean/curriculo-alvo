import "server-only";
import { buscarJson } from "../http";
import { ESTADOS } from "@/shared/estados";

// Gupy: portal público de vagas (portal.gupy.io), sem chave. API não oficial: pode mudar sem aviso.
const MODALIDADE = { remote: "remoto", hybrid: "hibrido", "on-site": "presencial" };
const NIVEL = { vacancy_type_internship: "estagio", vacancy_type_trainee: "estagio", vacancy_type_apprentice: "estagio", vacancy_type_junior_apprentice: "estagio" };
const NOME_UF = Object.fromEntries(ESTADOS.map((e) => [e.uf, e.nome]));
const POR_PAGINA = 100; // máximo aceito pela API

export const nome = "Gupy";

// Pede páginas seguidas até acabar (ou até `maxPaginas`). A API devolve as mais recentes primeiro,
// então só a 1ª página escondia vagas mais antigas, mas ainda abertas.
async function paginar(params, maxPaginas) {
  const out = [];
  for (let p = 0; p < maxPaginas; p++) {
    const data = await buscarJson(`https://portal.gupy.io/api/job-search/jobs?${params}&limit=${POR_PAGINA}&offset=${p * POR_PAGINA}`);
    const lista = data.data || [];
    out.push(...lista);
    if (lista.length < POR_PAGINA) break;
  }
  return out;
}

// Com local escolhido: busca as vagas de cada estado do raio (filtro da própria Gupy) e, à parte,
// as remotas. Sem local: as primeiras páginas do Brasil todo.
export async function buscar(q, { ufs = [] } = {}) {
  const base = `jobName=${encodeURIComponent(q)}`;
  const consultas = ufs.length
    ? [...ufs.filter((uf) => NOME_UF[uf]).map((uf) => paginar(`${base}&state=${encodeURIComponent(NOME_UF[uf])}`, 3)), paginar(`${base}&workplaceType=remote`, 2)]
    : [paginar(base, 3)];
  const r = await Promise.allSettled(consultas);
  if (r.every((x) => x.status === "rejected")) throw r[0].reason;
  return r.filter((x) => x.status === "fulfilled").flatMap((x) => x.value).map((j) => ({
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
  }));
}
