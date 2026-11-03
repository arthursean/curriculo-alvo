import "server-only";
import { buscarJson } from "../http";

// Gupy: portal público de vagas (portal.gupy.io), sem chave. API não oficial: pode mudar sem aviso.
const MODALIDADE = { remote: "remoto", hybrid: "hibrido", "on-site": "presencial" };
const NIVEL = { vacancy_type_internship: "estagio", vacancy_type_trainee: "estagio", vacancy_type_apprentice: "estagio", vacancy_type_junior_apprentice: "estagio" };

export const nome = "Gupy";

export async function buscar(q) {
  const data = await buscarJson(`https://portal.gupy.io/api/job-search/jobs?jobName=${encodeURIComponent(q)}&limit=60&offset=0`);
  return (data.data || []).map((j) => ({
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
