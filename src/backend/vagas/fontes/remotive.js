import "server-only";
import { buscarJson } from "../http";

// Remotive: vagas remotas internacionais, sem chave.
export const nome = "Remotive";

export async function buscar(q) {
  const data = await buscarJson(`https://remotive.com/api/remote-jobs?search=${encodeURIComponent(q)}&limit=60`);
  return (data.jobs || []).map((j) => ({
    id: `remotive-${j.id}`,
    titulo: j.title,
    empresa: j.company_name,
    local: j.candidate_required_location || "Remoto",
    descricao: j.description,
    url: j.url,
    publicadaEm: j.publication_date,
    categoria: j.category,
    salario: j.salary || null,
    tags: j.tags || [],
    remoto: true,
    fonte: nome,
  }));
}
