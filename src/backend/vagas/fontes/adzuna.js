import "server-only";
import { buscarJson } from "../http";

// Adzuna: vagas do Brasil (opcional; precisa de ADZUNA_APP_ID e ADZUNA_APP_KEY gratuitos).
export const nome = "Adzuna";

// Devolve null quando não está configurada: a fonte é simplesmente ignorada.
export async function buscar(q, { dias } = {}) {
  const { ADZUNA_APP_ID: id, ADZUNA_APP_KEY: key } = process.env;
  if (!id || !key) return null;
  const params = new URLSearchParams({ app_id: id, app_key: key, results_per_page: "50", what: q, sort_by: "date", "content-type": "application/json" });
  if (dias) params.set("max_days_old", String(dias));
  const data = await buscarJson(`https://api.adzuna.com/v1/api/jobs/br/search/1?${params}`);
  const real = (v) => `R$ ${Math.round(v).toLocaleString("pt-BR")}`;
  return (data.results || []).map((j) => ({
    id: `adzuna-${j.id}`,
    titulo: j.title?.replace(/<[^>]+>/g, ""),
    empresa: j.company?.display_name || "Empresa confidencial",
    local: j.location?.display_name || "Brasil",
    descricao: j.description,
    url: j.redirect_url,
    publicadaEm: j.created,
    categoria: j.category?.label,
    // A Adzuna informa salário anual: convertemos para mensal (÷ 12) para o filtro e a exibição.
    salario: j.salary_min ? `${real(j.salary_min / 12)}${j.salary_max && j.salary_max !== j.salary_min ? ` – ${real(j.salary_max / 12)}` : ""} /mês` : null,
    salarioMin: j.salary_min ? Math.round(j.salary_min / 12) : undefined,
    salarioMax: j.salary_min ? Math.round((j.salary_max || j.salary_min) / 12) : undefined,
    tags: [],
    fonte: nome,
  }));
}
