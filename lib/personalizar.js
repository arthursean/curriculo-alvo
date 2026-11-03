// Algoritmo próprio de personalização: roda no navegador, sem IA e sem custo por uso.
// Ideia geral:
//  1. extrair as competências que a vaga pede (dicionário com sinônimos PT/EN + competências do próprio perfil);
//  2. dar peso a cada uma (aparece no título, quantas vezes aparece, se está em trecho de "requisitos");
//  3. cruzar com o perfil para medir compatibilidade, ordenar competências, experiências e tópicos;
//  4. montar um resumo a partir de modelos, usando só fatos do perfil (nada é inventado).
import { contem, diasDesde, normalizar } from "./texto";
import { classificarNivel } from "./vagas";

// Cada grupo: nome exibido + formas como aparece nas vagas.
const DICIONARIO = [
  ["JavaScript", "javascript", "js", "ecmascript"], ["TypeScript", "typescript", "ts"], ["React", "react", "react.js", "reactjs"],
  ["Next.js", "next.js", "nextjs"], ["Node.js", "node.js", "nodejs", "node"], ["Vue.js", "vue", "vue.js", "vuejs"], ["Angular", "angular"],
  ["HTML", "html", "html5"], ["CSS", "css", "css3", "sass", "scss", "tailwind"], ["Python", "python"], ["Java", "java", "spring", "spring boot"],
  ["C#", "c#", ".net", "dotnet", "asp.net"], ["PHP", "php", "laravel"], ["Go", "golang"], ["Ruby", "ruby", "rails"], ["Kotlin", "kotlin"],
  ["Swift", "swift", "ios"], ["Flutter", "flutter", "dart"], ["React Native", "react native"], ["Android", "android"],
  ["SQL", "sql", "t-sql", "pl/sql"], ["PostgreSQL", "postgresql", "postgres"], ["MySQL", "mysql"], ["MongoDB", "mongodb", "mongo"], ["Redis", "redis"],
  ["AWS", "aws", "amazon web services"], ["Azure", "azure"], ["Google Cloud", "gcp", "google cloud"], ["Docker", "docker", "containers"],
  ["Kubernetes", "kubernetes", "k8s"], ["Terraform", "terraform"], ["CI/CD", "ci/cd", "ci", "github actions", "gitlab ci", "jenkins"],
  ["Git", "git", "github", "gitlab"], ["Linux", "linux"], ["APIs REST", "rest", "restful", "api rest", "apis"], ["GraphQL", "graphql"],
  ["Microsserviços", "microsservicos", "microservices"], ["Testes automatizados", "testes automatizados", "jest", "cypress", "unit tests", "testes unitarios", "tdd"],
  ["Power BI", "power bi", "powerbi"], ["Tableau", "tableau"], ["Excel", "excel", "planilhas", "spreadsheets"], ["Looker", "looker"],
  ["Spark", "spark", "pyspark"], ["Airflow", "airflow"], ["Pandas", "pandas"], ["Machine Learning", "machine learning", "aprendizado de maquina", "ml"],
  ["Estatística", "estatistica", "statistics"], ["ETL", "etl", "elt", "pipelines de dados", "data pipelines"], ["Análise de dados", "analise de dados", "data analysis", "analytics"],
  ["Figma", "figma"], ["UX", "ux", "user experience", "experiencia do usuario"], ["UI", "ui", "user interface"], ["Design System", "design system"],
  ["Pesquisa com usuários", "pesquisa com usuarios", "user research", "ux research"],
  ["Scrum", "scrum"], ["Kanban", "kanban"], ["Metodologias ágeis", "agile", "agil", "metodologias ageis"], ["Jira", "jira"], ["OKR", "okr", "okrs"],
  ["Gestão de projetos", "gestao de projetos", "project management", "pmp", "pmo"], ["Gestão de produto", "product management", "gestao de produto", "roadmap"],
  ["SEO", "seo"], ["Google Ads", "google ads", "adwords"], ["Meta Ads", "meta ads", "facebook ads"], ["Marketing digital", "marketing digital", "digital marketing"],
  ["CRM", "crm"], ["Salesforce", "salesforce"], ["HubSpot", "hubspot"], ["Inbound", "inbound"], ["Copywriting", "copywriting", "redacao publicitaria"],
  ["Redes sociais", "redes sociais", "social media"], ["Prospecção", "prospeccao", "prospecting", "outbound"], ["Negociação", "negociacao", "negotiation"],
  ["Atendimento ao cliente", "atendimento ao cliente", "customer service", "customer support", "sac"], ["Customer Success", "customer success", "cs"],
  ["SAP", "sap"], ["TOTVS", "totvs", "protheus"], ["Contabilidade", "contabilidade", "accounting", "contabil"], ["Fiscal", "fiscal", "tributario", "impostos"],
  ["Conciliação", "conciliacao bancaria", "conciliacao"], ["Contas a pagar e receber", "contas a pagar", "contas a receber"], ["Orçamento", "orcamento", "budget", "fp&a"],
  ["Recrutamento e seleção", "recrutamento", "selecao", "recruitment", "talent acquisition"], ["Departamento pessoal", "departamento pessoal", "folha de pagamento", "payroll"],
  ["Legislação trabalhista", "legislacao trabalhista", "clt"], ["LGPD", "lgpd", "gdpr"], ["Compliance", "compliance"],
  ["Logística", "logistica", "logistics", "supply chain", "cadeia de suprimentos"], ["Compras", "compras", "procurement", "suprimentos"],
  ["Liderança", "lideranca", "leadership", "gestao de equipes", "people management"], ["Comunicação", "comunicacao", "communication"],
  ["Trabalho em equipe", "trabalho em equipe", "teamwork", "colaboracao"], ["Resolução de problemas", "resolucao de problemas", "problem solving"],
  ["Pacote Office", "pacote office", "microsoft office", "powerpoint"],
];
const IDIOMAS = [["Inglês", "ingles", "english"], ["Espanhol", "espanhol", "spanish"], ["Francês", "frances", "french"], ["Alemão", "alemao", "german", "deutsch"]];
const NIVEL_IDIOMA = { "Básico": 1, "Intermediário": 2, "Avançado": 3, "Fluente": 4, "Nativo": 5 };

// Palavras que indicam o trecho de requisitos obrigatórios da vaga.
const MARCA_REQUISITO = /(requisitos|requirements|obrigatorio|must have|o que esperamos|what you.?ll need|qualificacoes|qualifications|voce precisa|exigencias)/;
const MARCA_DIFERENCIAL = /(diferencia|nice to have|desejavel|bonus|plus|preferred)/;

function linhas(texto = "") {
  return String(texto)
    .split(/\n|•|;|(?<=\.)\s+(?=[A-ZÀ-Ú])/)
    .map((l) => l.replace(/^[-*\s]+/, "").trim())
    .filter(Boolean);
}

function aparicoes(texto, termo) {
  const t = normalizar(termo).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // Ponto conta como parte da palavra ("js" não casa dentro de "node.js"), exceto no fim de frase.
  return (normalizar(texto).match(new RegExp(`(^|[^a-z0-9.])${t}(?![a-z0-9]|\\.[a-z0-9])`, "g")) || []).length;
}

// Grupo do dicionário a que uma competência do perfil pertence (para casar sinônimos).
function grupoDe(competencia) {
  const n = normalizar(competencia);
  return DICIONARIO.find(([nome, ...formas]) => normalizar(nome) === n || formas.includes(n));
}

// Divide a descrição em trechos de requisitos, diferenciais e o resto.
function secoesDaVaga(descricao) {
  const sec = { requisitos: [], diferenciais: [], geral: [] };
  let atual = "geral";
  for (const l of linhas(descricao)) {
    const n = normalizar(l);
    if (l.length < 80 && MARCA_DIFERENCIAL.test(n)) atual = "diferenciais";
    else if (l.length < 80 && MARCA_REQUISITO.test(n)) atual = "requisitos";
    sec[atual].push(l);
  }
  return { requisitos: sec.requisitos.join("\n"), diferenciais: sec.diferenciais.join("\n"), geral: sec.geral.join("\n") };
}

// Lista ponderada do que a vaga pede.
function termosDaVaga(vaga, perfil) {
  const titulo = vaga.titulo || "";
  const { requisitos, diferenciais, geral } = secoesDaVaga(vaga.descricao);
  const tudo = `${titulo}\n${vaga.descricao}\n${(vaga.tags || []).join(" ")}`;
  const grupos = [...DICIONARIO];
  // Competências do perfil fora do dicionário também contam.
  for (const c of perfil.competencias) if (!grupoDe(c)) grupos.push([c, normalizar(c)]);

  const termos = [];
  for (const [nome, ...formas] of grupos) {
    const conta = (txt) => formas.reduce((s, f) => s + aparicoes(txt, f), 0);
    const total = conta(tudo);
    if (!total) continue;
    let peso = Math.min(total, 4);
    if (conta(titulo)) peso += 4;
    if (conta(requisitos)) peso += 3;
    if (conta(diferenciais)) peso += 1;
    if (!conta(requisitos) && !conta(titulo) && conta(geral) === 1) peso = Math.max(1, peso - 1);
    termos.push({ nome, formas, peso, obrigatorio: Boolean(conta(titulo) || conta(requisitos)) });
  }
  return termos.sort((a, b) => b.peso - a.peso).slice(0, 25);
}

function anosDeExperiencia(experiencias) {
  const meses = experiencias.reduce((s, e) => {
    const completa = (d) => /^\d{4}-\d{2}$/.test(d || "");
    if (!completa(e.inicio)) return s;
    const fim = e.atual || !completa(e.fim) ? new Date() : new Date(`${e.fim}-01`);
    const m = (fim - new Date(`${e.inicio}-01`)) / (30.44 * 86400000);
    return s + Math.max(0, m);
  }, 0);
  return Math.floor(meses / 12);
}

const listar = (xs) => (xs.length > 1 ? `${xs.slice(0, -1).join(", ")} e ${xs.at(-1)}` : xs[0] || "");

export function personalizar(perfil, vaga) {
  const termos = termosDaVaga(vaga, perfil);
  const textoPerfil = [
    perfil.titulo, perfil.resumo, perfil.competencias.join(" "), perfil.certificacoes.join(" "),
    ...perfil.experiencias.map((e) => `${e.cargo} ${e.descricao}`), ...perfil.formacao.map((f) => f.curso),
  ].join("\n");
  const temNoPerfil = (t) => t.formas.some((f) => aparicoes(textoPerfil, f));

  const atendidos = termos.filter(temNoPerfil);
  const faltando = termos.filter((t) => !temNoPerfil(t));

  // Competências: as que a vaga pede primeiro (por peso), depois as demais na ordem do perfil.
  const pesoCompetencia = (c) => {
    const g = grupoDe(c);
    const t = termos.find((x) => (g ? x.nome === g[0] : normalizar(x.nome) === normalizar(c)));
    return t ? t.peso : 0;
  };
  const competencias = [...perfil.competencias].sort((a, b) => pesoCompetencia(b) - pesoCompetencia(a));
  const destaques = competencias.filter((c) => pesoCompetencia(c) > 0);

  // Experiências e tópicos: mais aderentes primeiro; empate mantém a ordem original.
  const pontuar = (txt) => termos.reduce((s, t) => s + (t.formas.some((f) => aparicoes(txt, f)) ? t.peso : 0), 0);
  const tituloVaga = normalizar(vaga.titulo);
  const experiencias = perfil.experiencias
    .map((e, ordem) => {
      const itens = linhas(e.descricao)
        .map((l, i) => ({ l, i, p: pontuar(l) + (/\d/.test(l) ? 1 : 0) }))
        .sort((a, b) => b.p - a.p || a.i - b.i)
        .map((x) => x.l);
      const cargoParecido = normalizar(e.cargo).split(/\s+/).filter((w) => w.length > 3 && tituloVaga.includes(w)).length;
      return { ...e, itens, _p: pontuar(`${e.cargo}\n${e.descricao}`) + cargoParecido * 3 + (e.atual ? 2 : 0), _o: ordem };
    })
    .sort((a, b) => b._p - a._p || a._o - b._o)
    .map(({ _p, _o, ...e }) => e);

  // Compatibilidade ponderada; requisitos obrigatórios contam mais.
  const pesoTotal = termos.reduce((s, t) => s + t.peso * (t.obrigatorio ? 1.5 : 1), 0);
  const pesoAtendido = atendidos.reduce((s, t) => s + t.peso * (t.obrigatorio ? 1.5 : 1), 0);
  let compatibilidade = pesoTotal ? Math.round((pesoAtendido / pesoTotal) * 100) : 50;

  // Idiomas exigidos.
  const dicas = [];
  const textoVaga = `${vaga.titulo}\n${vaga.descricao}`;
  for (const [nome, ...formas] of IDIOMAS) {
    if (!formas.some((f) => aparicoes(textoVaga, f))) continue;
    const meu = perfil.idiomas.find((i) => normalizar(i.idioma).includes(normalizar(nome).slice(0, 5)));
    if (!meu) {
      faltando.push({ nome, peso: 3, obrigatorio: true });
      compatibilidade = Math.max(0, compatibilidade - 10);
    } else if (NIVEL_IDIOMA[meu.nivel] >= 3) {
      atendidos.push({ nome: `${nome} ${meu.nivel.toLowerCase()}`, peso: 3 });
    }
  }
  // A vaga pode estar escrita em inglês: um currículo em inglês pode ajudar.
  if (/\b(we are|you will|requirements|experience with|our team)\b/.test(normalizar(vaga.descricao))) {
    dicas.push("A vaga está em inglês: considere enviar também uma versão do currículo em inglês.");
  }

  // Nível da vaga x anos de experiência.
  const anos = anosDeExperiencia(perfil.experiencias);
  const nivelVaga = classificarNivel(vaga.titulo, vaga.descricao);
  if (nivelVaga === "senior" && anos < 5) dicas.push(`A vaga é sênior e seu perfil soma cerca de ${anos} ano(s): destaque projetos complexos e responsabilidades de referência técnica.`);
  if (nivelVaga === "lideranca" && !aparicoes(textoPerfil, "lider") && !aparicoes(textoPerfil, "coorden") && !aparicoes(textoPerfil, "gest")) {
    dicas.push("A vaga é de liderança: inclua no perfil experiências em que você coordenou pessoas, projetos ou decisões.");
  }
  if ((nivelVaga === "junior" || nivelVaga === "estagio") && anos >= 5) dicas.push("Você tem mais experiência do que a vaga pede: deixe claro no contato por que esta posição te interessa.");

  const obrigatoriasFaltando = faltando.filter((t) => t.obrigatorio).map((t) => t.nome);
  if (obrigatoriasFaltando.length) {
    dicas.push(`Requisitos da vaga que não aparecem no seu perfil: ${listar(obrigatoriasFaltando.slice(0, 4))}. Se você já usou algum deles, adicione ao perfil e gere de novo.`);
  }
  if (perfil.experiencias.some((e) => linhas(e.descricao).length < 2)) {
    dicas.push("Descreva cada experiência em tópicos com resultados (números, prazos, impacto): eles são priorizados conforme a vaga.");
  }
  if (diasDesde(vaga.publicadaEm) > 20) dicas.push("A vaga foi publicada há mais de 20 dias: confirme se ainda está aberta antes de se candidatar.");

  // Resumo montado com fatos do perfil.
  const principal = experiencias[0];
  const top = destaques.slice(0, 4);
  const partes = [];
  if (perfil.resumo?.trim()) {
    partes.push(perfil.resumo.trim().replace(/([^.!?])$/, "$1."));
  } else {
    const titulo = perfil.titulo || principal?.cargo || "Profissional";
    let abertura = anos >= 1 ? `${titulo} com ${anos} ano${anos > 1 ? "s" : ""} de experiência` : titulo;
    if (principal?.empresa && normalizar(principal.cargo) === normalizar(titulo)) abertura += `, atualmente na ${principal.empresa}`;
    else if (principal?.empresa) abertura += `, com atuação recente como ${principal.cargo} na ${principal.empresa}`;
    partes.push(`${abertura}.`);
  }
  if (top.length) partes.push(`Experiência prática com ${listar(top)}, competências centrais para a posição de ${vaga.titulo}${vaga.empresa ? ` na ${vaga.empresa}` : ""}.`);
  const resultado = principal?.itens?.find((l) => /\d/.test(l));
  if (resultado) partes.push(`Entre os resultados: ${resultado.charAt(0).toLowerCase()}${resultado.slice(1).replace(/\.$/, "")}.`);
  const resumo = partes.join(" ");

  return {
    titulo: perfil.titulo,
    resumo,
    competencias,
    destaques,
    experiencias,
    compatibilidade: Math.max(0, Math.min(100, compatibilidade)),
    atendidos: atendidos.map((t) => t.nome),
    lacunas: faltando.map((t) => t.nome).slice(0, 10),
    dicas,
  };
}
