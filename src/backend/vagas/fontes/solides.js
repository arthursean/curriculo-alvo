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

const pagina = (q, p, locais = "") =>
  buscarJson(`https://vagas.solides.com.br/api/vacancies?page=${p}&take=25&title=${encodeURIComponent(q)}&locations=${encodeURIComponent(locais)}`, { cacheMin: 10 }).catch(() => ({}));

// Páginas de 1 até `max` (a 1ª diz quantas existem; as demais vão em paralelo).
async function paginas(q, locais, max) {
  const primeira = await pagina(q, 1, locais);
  const total = Math.min(primeira.totalPages || 1, max);
  const resto = await Promise.all(Array.from({ length: total - 1 }, (_, i) => pagina(q, i + 2, locais)));
  return [primeira, ...resto];
}

function mapear(j) {
  return {
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
  };
}

const juntar = (lista) => {
  if (lista.every((d) => !d.data)) throw new Error("Sólides indisponível");
  return lista.flatMap((d) => d.data || []).map(mapear);
};

// Por palavra-chave. A API aceita no máximo 25 por página (acima disso responde 500). Sempre
// 2 páginas do Brasil todo (é onde vêm as remotas); com local escolhido, também as páginas dos
// estados do raio (filtro da própria Sólides, aceita "PE,PB").
// Com `regiaoCoberta` (a lista completa da região já veio por `todas`), só 1 página do Brasil todo.
export async function buscar(q, { ufs = [], regiaoCoberta = false } = {}) {
  if (regiaoCoberta) return juntar([await pagina(q, 1)]);
  const tarefas = [1, 2].map((p) => pagina(q, p));
  if (ufs.length) tarefas.push(paginas(q, ufs.join(","), 6));
  return juntar((await Promise.all(tarefas)).flat());
}

// Todas as vagas dos estados (sem palavra-chave), para a busca por área. Até 2.000 (as mais
// recentes). Sem estado, não se aplica.
export async function todas({ ufs = [] } = {}) {
  if (!ufs.length) return [];
  return juntar(await paginas("", ufs.join(","), 80));
}
