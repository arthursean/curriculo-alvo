import "server-only";
import { buscarJson } from "../http";

// Sólides Vagas: portal público (vagas.solides.com.br), sem chave. API não oficial: pode mudar sem aviso.
const MODALIDADE = { remoto: "remoto", hibrido: "hibrido", presencial: "presencial" };

function nivel(senioridades = []) {
  const n = senioridades.map((s) => s.name).join(" ").toLowerCase();
  if (/estag|trainee|aprendiz/.test(n)) return "estagio";
  if (/gerente|diretor|coorden|lider|líder|supervis/.test(n)) return "lideranca";
  if (/s[eê]nior|especialista/.test(n)) return "senior";
  if (/pleno/.test(n)) return "pleno";
  if (/j[uú]nior/.test(n)) return "junior";
  return undefined;
}

function salario(s) {
  if (!s?.showRangeToApplicant || !(s.finalRange > 0)) return null;
  const fmt = (v) => `R$ ${Math.round(v).toLocaleString("pt-BR")}`;
  if (!(s.initialRange > 0)) return `até ${fmt(s.finalRange)}`;
  return s.initialRange === s.finalRange ? fmt(s.finalRange) : `${fmt(s.initialRange)} – ${fmt(s.finalRange)}`;
}

// Valores numéricos (R$/mês) para o filtro de faixa salarial. "até R$ 2.500" vira 2.500–2.500.
function faixa(s) {
  if (!s?.showRangeToApplicant || !(s.finalRange > 0)) return {};
  return { salarioMin: s.initialRange > 0 ? s.initialRange : s.finalRange, salarioMax: s.finalRange };
}

export const nome = "Sólides";

export async function buscar(q) {
  // A API aceita no máximo 25 por página (acima disso responde 500): buscamos 2 páginas.
  const paginas = await Promise.all([1, 2].map((p) =>
    buscarJson(`https://vagas.solides.com.br/api/vacancies?page=${p}&take=25&title=${encodeURIComponent(q)}&locations=`).catch(() => ({}))));
  if (paginas.every((d) => !d.data)) throw new Error("Sólides indisponível");
  return paginas.flatMap((d) => d.data || []).map((j) => ({
    id: `solides-${j.id}`,
    titulo: j.title?.trim(),
    empresa: j.companyName || "Empresa confidencial",
    local: j.homeOffice ? "Remoto" : [j.city?.name, j.state?.code].filter(Boolean).join(", ") || "Brasil",
    descricao: j.description,
    url: `https://vagas.solides.com.br/vaga/${j.id}`,
    publicadaEm: j.createdAt,
    categoria: "",
    salario: salario(j.salary),
    ...faixa(j.salary),
    tags: (j.hardSkills || []).map((h) => h.name).filter(Boolean),
    modalidade: MODALIDADE[j.jobType] || (j.homeOffice ? "remoto" : undefined),
    nivel: nivel(j.seniority),
    fonte: nome,
  }));
}
