import { montarVaga } from "@/lib/vagas";
import { contem, diasDesde } from "@/lib/texto";
import { naoAutenticado, usuarioAtual } from "@/lib/sessao";

async function buscarJson(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(12000), headers: { "User-Agent": "CurriculoAlvo/1.0" } });
  if (!res.ok) throw new Error(`${res.status} em ${new URL(url).host}`);
  return res.json();
}

// Gupy: portal público de vagas (portal.gupy.io), sem chave. API não oficial: pode mudar sem aviso.
const MODALIDADE_GUPY = { remote: "remoto", hybrid: "hibrido", "on-site": "presencial" };
const NIVEL_GUPY = { vacancy_type_internship: "estagio", vacancy_type_trainee: "estagio", vacancy_type_apprentice: "estagio", vacancy_type_junior_apprentice: "estagio" };
async function gupy(q) {
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
    modalidade: MODALIDADE_GUPY[j.workplaceType],
    nivel: NIVEL_GUPY[j.type],
    fonte: "Gupy",
  }));
}

// Sólides Vagas: portal público (vagas.solides.com.br), sem chave. API não oficial: pode mudar sem aviso.
const MODALIDADE_SOLIDES = { remoto: "remoto", hibrido: "hibrido", presencial: "presencial" };
function nivelSolides(senioridades = []) {
  const n = senioridades.map((s) => s.name).join(" ").toLowerCase();
  if (/estag|trainee|aprendiz/.test(n)) return "estagio";
  if (/gerente|diretor|coorden|lider|líder|supervis/.test(n)) return "lideranca";
  if (/s[eê]nior|especialista/.test(n)) return "senior";
  if (/pleno/.test(n)) return "pleno";
  if (/j[uú]nior/.test(n)) return "junior";
  return undefined;
}
async function solides(q) {
  // A API aceita no máximo 25 por página (acima disso responde 500): buscamos 2 páginas.
  const paginas = await Promise.all([1, 2].map((p) =>
    buscarJson(`https://vagas.solides.com.br/api/vacancies?page=${p}&take=25&title=${encodeURIComponent(q)}&locations=`).catch(() => ({ data: [] }))));
  const lista = paginas.flatMap((d) => d.data || []);
  if (!lista.length && paginas.every((d) => !d.data)) throw new Error("Sólides indisponível");
  return lista.map((j) => {
    const s = j.salary;
    const salario = s?.showRangeToApplicant && s.finalRange > 0
      ? (s.initialRange > 0 ? `R$ ${s.initialRange.toLocaleString("pt-BR")} – R$ ${s.finalRange.toLocaleString("pt-BR")}` : `até R$ ${s.finalRange.toLocaleString("pt-BR")}`)
      : null;
    return {
      id: `solides-${j.id}`,
      titulo: j.title?.trim(),
      empresa: j.companyName || "Empresa confidencial",
      local: j.homeOffice ? "Remoto" : [j.city?.name, j.state?.code].filter(Boolean).join(", ") || "Brasil",
      descricao: j.description,
      url: `https://vagas.solides.com.br/vaga/${j.id}`,
      publicadaEm: j.createdAt,
      categoria: "",
      salario,
      tags: (j.hardSkills || []).map((h) => h.name).filter(Boolean),
      modalidade: MODALIDADE_SOLIDES[j.jobType] || (j.homeOffice ? "remoto" : undefined),
      nivel: nivelSolides(j.seniority),
      fonte: "Sólides",
    };
  });
}

// Adzuna: vagas do Brasil (precisa de ADZUNA_APP_ID e ADZUNA_APP_KEY gratuitos).
async function adzuna(q, local, dias) {
  const { ADZUNA_APP_ID: id, ADZUNA_APP_KEY: key } = process.env;
  if (!id || !key) return null;
  const params = new URLSearchParams({ app_id: id, app_key: key, results_per_page: "50", what: q, sort_by: "date", "content-type": "application/json" });
  if (local) params.set("where", local);
  if (dias) params.set("max_days_old", String(dias));
  const data = await buscarJson(`https://api.adzuna.com/v1/api/jobs/br/search/1?${params}`);
  return (data.results || []).map((j) => ({
    id: `adzuna-${j.id}`,
    titulo: j.title?.replace(/<[^>]+>/g, ""),
    empresa: j.company?.display_name || "Empresa confidencial",
    local: j.location?.display_name || "Brasil",
    descricao: j.description,
    url: j.redirect_url,
    publicadaEm: j.created,
    categoria: j.category?.label,
    salario: j.salary_min ? `R$ ${Math.round(j.salary_min).toLocaleString("pt-BR")}${j.salary_max && j.salary_max !== j.salary_min ? ` – R$ ${Math.round(j.salary_max).toLocaleString("pt-BR")}` : ""}` : null,
    tags: [],
    fonte: "Adzuna",
  }));
}

// Remotive: vagas remotas internacionais, sem chave.
async function remotive(q) {
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
    fonte: "Remotive",
  }));
}

// Arbeitnow: vagas internacionais (remotas e presenciais), sem chave; filtramos pelas palavras-chave.
async function arbeitnow(q) {
  const data = await buscarJson("https://www.arbeitnow.com/api/job-board-api");
  return (data.data || []).map((j) => ({
    id: `arbeitnow-${j.slug}`,
    titulo: j.title,
    empresa: j.company_name,
    local: j.location || "",
    descricao: j.description,
    url: j.url,
    publicadaEm: new Date(j.created_at * 1000).toISOString(),
    categoria: (j.tags || []).join(", "),
    salario: null,
    tags: [...(j.tags || []), ...(j.job_types || [])],
    remoto: j.remote,
    fonte: "Arbeitnow",
  }));
}

function bateComBusca(v, q) {
  const termos = q.split(/[,\s]+/).filter((t) => t.length > 1);
  const texto = `${v.titulo} ${v.tags.join(" ")} ${v.descricao}`;
  return termos.every((t) => contem(texto, t));
}

export async function GET(req) {
  // Só usuários logados buscam, para proteger a cota das APIs de vagas.
  if (!(await usuarioAtual())) return naoAutenticado();
  const p = new URL(req.url).searchParams;
  const q = (p.get("q") || "").trim();
  const local = (p.get("local") || "").trim();
  const dias = Number(p.get("dias")) || 0;
  const modalidades = p.getAll("modalidade");
  const niveis = p.getAll("nivel");
  const areas = p.getAll("area");

  if (!q) return Response.json({ erro: "Digite ao menos uma palavra-chave." }, { status: 400 });

  const fontes = [
    ["Gupy", gupy(q)],
    ["Sólides", solides(q)],
    ["Adzuna", adzuna(q, local, dias)],
    ["Remotive", remotive(q)],
    ["Arbeitnow", arbeitnow(q)],
  ];
  const resultados = await Promise.allSettled(fontes.map(([, p]) => p));

  const status = [];
  let vagas = [];
  resultados.forEach((r, i) => {
    const nome = fontes[i][0];
    if (r.status === "rejected") status.push({ nome, ok: false, detalhe: String(r.reason?.message || r.reason) });
    else if (r.value === null) return; // fonte opcional sem chave configurada
    else {
      const lista = nome === "Arbeitnow" ? r.value.filter((v) => bateComBusca(v, q)) : r.value;
      status.push({ nome, ok: true, total: lista.length });
      vagas.push(...lista);
    }
  });

  vagas = vagas.map(montarVaga);
  if (local) vagas = vagas.filter((v) => v.fonte === "Adzuna" || v.modalidade === "remoto" || contem(v.local, local));
  if (dias) vagas = vagas.filter((v) => diasDesde(v.publicadaEm) <= dias);
  if (modalidades.length) vagas = vagas.filter((v) => modalidades.includes(v.modalidade));
  if (niveis.length) vagas = vagas.filter((v) => niveis.includes(v.nivel));
  if (areas.length) vagas = vagas.filter((v) => areas.includes(v.area));

  vagas.sort((a, b) => new Date(b.publicadaEm) - new Date(a.publicadaEm));

  return Response.json({ vagas: vagas.slice(0, 200), fontes: status });
}
