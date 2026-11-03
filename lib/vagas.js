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

export function classificarArea(...textos) {
  const t = ` ${normalizar(textos.join(" "))} `;
  let melhor = null;
  let pontos = 0;
  for (const a of AREAS) {
    const p = a.termos.reduce((s, termo) => s + (t.includes(termo) ? 1 : 0), 0);
    if (p > pontos) {
      melhor = a.id;
      pontos = p;
    }
  }
  return melhor || "outros";
}

export function montarVaga(v) {
  const descricao = semHtml(v.descricao);
  return {
    ...v,
    descricao,
    // Quando a fonte informa modalidade/nível, vale o dado da fonte; senão deduzimos do texto.
    nivel: v.nivel || classificarNivel(v.titulo, descricao),
    modalidade: v.modalidade || classificarModalidade({ ...v, descricao }),
    area: classificarArea(v.titulo, v.categoria || "", descricao.slice(0, 600)),
    idioma: detectarIdioma(`${v.titulo}\n${descricao}`),
  };
}
