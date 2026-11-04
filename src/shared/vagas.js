import { normalizar, semHtml } from "./texto";
import { detectarIdioma } from "./traducao";

export const AREAS = [
  { id: "tecnologia", nome: "Tecnologia / Desenvolvimento", termos: ["desenvolvedor", "developer", "software", "engineer", "programador", "frontend", "front-end", "backend", "back-end", "fullstack", "full stack", "devops", "cloud", "qa", "mobile", "ti ", "infraestrutura", "suporte tecnico", "sre", "seguranca da informacao", "security"] },
  { id: "dados", nome: "Dados / BI / IA", termos: ["dados", "data", "analytics", "bi ", "business intelligence", "machine learning", "cientista", "scientist", "ia ", "ai ", "estatistic"] },
  { id: "design", nome: "Design / UX", termos: ["design", "ux", "ui", "designer", "produto visual", "figma"] },
  { id: "produto", nome: "Produto / Projetos", termos: ["product manager", "product owner", "produto", "projetos", "project manager", "scrum", "agile"] },
  { id: "marketing", nome: "Marketing / Comunicação", termos: ["marketing", "comunicacao", "conteudo", "content", "seo", "social media", "growth", "midia", "publicidade", "copywriter"] },
  { id: "vendas", nome: "Vendas / Comercial", termos: ["vendas", "sales", "comercial", "account executive", "sdr", "bdr", "representante", "customer success"] },
  { id: "financeiro", nome: "Financeiro / Contábil", termos: ["financeiro", "finance", "contabil", "accounting", "fiscal", "controladoria", "tesouraria", "auditoria"] },
  { id: "rh", nome: "RH / Pessoas", termos: ["recursos humanos", "rh", "human resources", "recrutamento", "recruiter", "talent", "pessoas", "people", "departamento pessoal"] },
  { id: "juridico", nome: "Jurídico", termos: ["juridico", "advogad", "legal", "lawyer", "compliance", "paralegal", "direito"] },
  { id: "saude", nome: "Saúde", termos: ["enfermeir", "medic", "saude", "health", "nurse", "farmac", "fisioterap", "psicolog", "nutricion"] },
  { id: "engenharia", nome: "Engenharia / Indústria", termos: ["engenheiro", "engenharia", "manutencao", "producao", "industrial", "mecanic", "eletric", "civil"] },
  { id: "administrativo", nome: "Administrativo / Operações", termos: ["administrativo", "assistente", "auxiliar", "operacoes", "operations", "logistica", "compras", "secretari", "recepcion"] },
  { id: "atendimento", nome: "Atendimento / Suporte", termos: ["atendimento", "customer support", "customer service", "suporte ao cliente", "call center", "sac"] },
  { id: "educacao", nome: "Educação", termos: ["professor", "teacher", "educacao", "pedagog", "instrutor", "tutor"] },
];

// Termos para buscar nas fontes as vagas de uma área (a Gupy e a Sólides só buscam por título).
// Com local escolhido, a busca por área também traz TODAS as vagas da região e classifica uma a
// uma; estes termos completam com as remotas e com o Brasil todo. Os primeiros são os mais
// abrangentes (com várias áreas marcadas, entram os primeiros de cada).
export const BUSCA_POR_AREA = {
  tecnologia: ["desenvolvedor", "software", "sistemas", "programador", "suporte", "infraestrutura", "devops", "qa", "front-end", "back-end", "full stack", "mobile", "segurança da informação", "redes", "cloud", "ti"],
  dados: ["dados", "data", "bi", "analytics", "cientista de dados", "engenheiro de dados", "inteligência artificial", "machine learning", "estatístico"],
  design: ["designer", "design", "ux", "ui", "produto digital", "motion"],
  produto: ["product", "produto", "projetos", "scrum", "agile", "pmo"],
  marketing: ["marketing", "social media", "conteúdo", "comunicação", "growth", "seo", "mídia", "publicidade", "copywriter"],
  vendas: ["vendas", "vendedor", "comercial", "representante", "consultor de vendas", "sdr", "customer success", "inside sales"],
  financeiro: ["financeiro", "contábil", "contador", "fiscal", "controladoria", "tesouraria", "faturamento", "auditoria", "custos"],
  rh: ["recursos humanos", "rh", "recrutamento", "departamento pessoal", "talent", "people", "treinamento"],
  juridico: ["advogado", "jurídico", "direito", "compliance", "paralegal"],
  saude: ["enfermeiro", "técnico de enfermagem", "saúde", "médico", "farmacêutico", "fisioterapeuta", "psicólogo", "nutricionista", "dentista"],
  engenharia: ["engenheiro", "engenharia", "manutenção", "produção", "técnico", "eletricista", "mecânico", "industrial", "qualidade", "segurança do trabalho"],
  administrativo: ["administrativo", "assistente", "auxiliar", "operações", "logística", "compras", "recepcionista", "secretária", "almoxarife", "estoque"],
  atendimento: ["atendimento", "atendente", "operador de telemarketing", "sac", "call center", "suporte ao cliente"],
  educacao: ["professor", "instrutor", "educação", "pedagogo", "monitor", "tutor", "coordenador pedagógico"],
};

// Termos de busca para as áreas marcadas: intercala as áreas (1º termo de cada, depois o 2º…)
// e limita o total, para não disparar buscas demais nas fontes.
export function termosParaAreas(areas, maximo = 16) {
  const listas = areas.map((a) => BUSCA_POR_AREA[a] || []).filter((l) => l.length);
  const termos = [];
  for (let i = 0; termos.length < maximo && listas.some((l) => l[i]); i++) {
    for (const l of listas) if (l[i] && termos.length < maximo) termos.push(l[i]);
  }
  return termos;
}

export const NIVEIS = [
  { id: "estagio", nome: "Estágio / Trainee", re: /\b(estagi\w*|intern(ship)?|trainee|aprendiz)\b/ },
  { id: "junior", nome: "Júnior", re: /\b(junior|jr\.?|entry[- ]level)\b/ },
  { id: "pleno", nome: "Pleno", re: /\b(pleno|mid[- ]?level|intermediate)\b/ },
  { id: "senior", nome: "Sênior", re: /\b(senior|sr\.?|especialista|specialist|staff|principal)\b/ },
  { id: "lideranca", nome: "Liderança / Gestão", re: /\b(lead|lider|lideranca|head|gerente|manager|coordenador\w*|diretor\w*|director|supervisor\w*|chief|cto|ceo)\b/ },
];

export const MODALIDADES = [
  { id: "remoto", nome: "Remoto" },
  { id: "hibrido", nome: "Híbrido" },
  { id: "presencial", nome: "Presencial" },
];

export function classificarNivel(titulo, descricao = "") {
  const t = normalizar(titulo);
  // Liderança primeiro: "Tech Lead Sênior" é liderança.
  for (const id of ["lideranca", "estagio", "senior", "pleno", "junior"]) {
    if (NIVEIS.find((n) => n.id === id).re.test(t)) return id;
  }
  const d = normalizar(descricao).slice(0, 1500);
  for (const id of ["estagio", "junior", "pleno", "senior"]) {
    if (NIVEIS.find((n) => n.id === id).re.test(d)) return id;
  }
  return "nao_informado";
}

export function classificarModalidade({ remoto, titulo = "", local = "", descricao = "" }) {
  const t = normalizar(`${titulo} ${local}`);
  const d = normalizar(descricao).slice(0, 3000);
  if (/\b(hibrido|hybrid)\b/.test(t) || /\b(modelo hibrido|regime hibrido|hybrid work|hybrid role|trabalho hibrido)\b/.test(d)) return "hibrido";
  if (remoto === true) return "remoto";
  if (/\b(remoto|remote|home office|anywhere|work from home|100% remoto)\b/.test(t + " " + d)) return "remoto";
  return "presencial";
}

// Cargos compostos que as palavras soltas classificam errado ("Engenheiro de Dados" não é
// Engenharia/Indústria). Testados no título antes da contagem.
const ENG = String.raw`(?:engenh\w*|engineer)(?:\s*\([ao]\))?\s+(?:de\s+|da\s+|of\s+)?`;
const CARGOS_COMPOSTOS = [
  [new RegExp(`${ENG}(?:dados|data|analytics|machine learning|ml|ia|ai|inteligencia artificial)\\b`), ["dados", "tecnologia"]],
  [/\b(?:data|analytics|ml|ai|machine learning|big data)\s+engineer/, ["dados", "tecnologia"]],
  [/\b(?:cientista|analista|arquiteto|arquiteta) (?:\([ao]\) )?de dados|data (?:scientist|analyst|architect)|analista de bi\b|\bbi analyst/, ["dados"]],
  [new RegExp(`${ENG}(?:software|computacao|sistemas|devops|cloud|plataforma|confiabilidade|seguranca|front-?end|back-?end|full ?stack|qa|testes|redes)\\b`), ["tecnologia"]],
  [/\b(?:software|devops|cloud|platform|site reliability|back-?end|front-?end|full ?stack|qa|security|mobile)\s+engineer/, ["tecnologia"]],
];

// O termo precisa começar uma palavra ("ux" não casa com "auxiliar", "ui" não casa com "possui").
// Termos curtos (até 3 letras) precisam ser a palavra inteira; os longos podem ser radical
// ("advogad" casa "advogado(a)").
const cacheTermo = new Map();
function reTermo(termo) {
  if (!cacheTermo.has(termo)) {
    const t = termo.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const fim = t.replace(/\\/g, "").length <= 3 ? "(?![a-z0-9])" : "";
    cacheTermo.set(termo, new RegExp(`(?<![a-z0-9])${t}${fim}`));
  }
  return cacheTermo.get(termo);
}

// Áreas da vaga, da principal para a secundária (no máximo 2). O título pesa mais que a
// categoria, que pesa mais que o começo da descrição.
export function classificarAreas(titulo = "", categoria = "", descricao = "") {
  const tt = ` ${normalizar(titulo)} `;
  for (const [re, areas] of CARGOS_COMPOSTOS) if (re.test(tt)) return areas;
  const tc = ` ${normalizar(categoria)} `;
  const td = ` ${normalizar(descricao)} `;
  const tem = (texto, termo) => reTermo(termo).test(texto);
  const pontos = AREAS.map((a) => ({
    id: a.id,
    p: a.termos.reduce((s, termo) => s + (tem(tt, termo) ? 3 : 0) + (tem(tc, termo) ? 2 : 0) + (tem(td, termo) ? 1 : 0), 0),
  }))
    .filter((x) => x.p > 0)
    .sort((a, b) => b.p - a.p);
  if (!pontos.length) return ["outros"];
  const [prim, seg] = pontos;
  return seg && seg.p >= 3 && seg.p >= prim.p * 0.6 ? [prim.id, seg.id] : [prim.id];
}

export const classificarArea = (titulo, categoria, descricao) => classificarAreas(titulo, categoria, descricao)[0];
// Vagas salvas antes das áreas múltiplas só têm `area`.
export const areasDaVaga = (v) => v.areas || [v.area];

// Salário escrito no texto da vaga ("Salário: R$ 3.500,00", "Remuneração de R$ 4.000 a R$ 5.000").
// Só vale logo depois de uma palavra de salário, para não pegar valor de vale-refeição etc.
const MARCA_SALARIO = /(sal[aá]rio|remunera[cç][aã]o|faixa salarial|bolsa)/gi;
const VALOR = /R\$\s?(\d{1,3}(?:\.\d{3})+|\d{3,6})(?:,\d{2})?(?:\s*(?:a|até|-|–)\s*(?:R\$\s?)?(\d{1,3}(?:\.\d{3})+|\d{3,6})(?:,\d{2})?)?/i;
const numero = (s) => Number(s.replace(/\./g, ""));

export function salarioDoTexto(texto = "") {
  for (const m of texto.matchAll(MARCA_SALARIO)) {
    // O valor precisa estar na mesma frase ("Salário a combinar. VR de R$ 900" não conta).
    const frase = texto.slice(m.index, m.index + 90).split(/[;\n]|\.(?!\d)/)[0];
    const v = frase.match(VALOR);
    if (!v) continue;
    const min = numero(v[1]);
    const max = v[2] ? numero(v[2]) : min;
    if (min < 500 || max > 100000 || max < min) continue;
    return { salarioMin: min, salarioMax: max };
  }
  return {};
}

const reais = (n) => `R$ ${n.toLocaleString("pt-BR")}`;

export function montarVaga(v) {
  const descricao = semHtml(v.descricao);
  // Faixa salarial em R$/mês: da fonte, ou lida no texto (não se aplica a vagas internacionais, em outra moeda).
  const faixa = v.salarioMin != null ? { salarioMin: v.salarioMin, salarioMax: v.salarioMax ?? v.salarioMin }
    : v.internacional ? {} : salarioDoTexto(descricao);
  const salario = v.salario || (faixa.salarioMin != null
    ? (faixa.salarioMin === faixa.salarioMax ? reais(faixa.salarioMin) : `${reais(faixa.salarioMin)} – ${reais(faixa.salarioMax)}`)
    : null);
  return {
    ...v,
    ...faixa,
    salario,
    descricao,
    // Quando a fonte informa modalidade/nível, vale o dado da fonte; senão deduzimos do texto.
    nivel: v.nivel || classificarNivel(v.titulo, descricao),
    modalidade: v.modalidade || classificarModalidade({ ...v, descricao }),
    ...(() => {
      const areas = classificarAreas(v.titulo, v.categoria || "", descricao.slice(0, 1200));
      return { area: areas[0], areas };
    })(),
    idioma: detectarIdioma(`${v.titulo}\n${descricao}`),
  };
}
