import "server-only";
import { buscarJson } from "../http";

// Remotive: vagas remotas internacionais, sem chave.
// Público brasileiro: só entram vagas abertas a quem mora no Brasil (mundo todo, Américas, LATAM, Brasil).
const ACEITA_BRASIL = /worldwide|anywhere|global|brazil|brasil|latam|latin america|south america|americas/i;

export const nome = "Remotive";

export async function buscar(q) {
  const data = await buscarJson(`https://remotive.com/api/remote-jobs?search=${encodeURIComponent(q)}&limit=100`);
  return (data.jobs || [])
    .filter((j) => !j.candidate_required_location || ACEITA_BRASIL.test(j.candidate_required_location))
    .map((j) => ({
      id: `remotive-${j.id}`,
      titulo: j.title,
      empresa: j.company_name,
      local: j.candidate_required_location || "Remoto",
      descricao: j.description,
      url: j.url,
      publicadaEm: j.publication_date,
      categoria: j.category,
      salario: j.salary || null, // em dólar e em formatos variados: não entra no filtro de faixa (R$)
      tags: j.tags || [],
      remoto: true,
      modalidade: "remoto",
      internacional: true,
      fonte: nome,
    }));
}
