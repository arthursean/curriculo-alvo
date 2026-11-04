// Leitura de um currículo em texto (extraído de PDF/DOCX) para preencher o perfil. BETA:
// é uma leitura por regras (títulos de seção, datas, e-mail etc.), sem IA — o usuário confere tudo.
import { normalizar } from "./texto";
import { novoId } from "./perfil";
import { IDIOMAS } from "./idiomas";

// Títulos de seção mais comuns (PT/EN/ES), já sem acento.
const SECOES = [
  ["resumo", /^(resumo( profissional)?|sobre( mim)?|perfil( profissional)?|objetivo( profissional)?|summary|profile|about( me)?|resumen)$/],
  ["experiencias", /^(experiencias?( profissiona(l|is))?|historico profissional|experience|work experience|professional experience|experiencia( laboral)?)$/],
  ["formacao", /^(formacao( academica)?|educacao|escolaridade|education|academic background|formacion)$/],
  ["projetos", /^(projetos?|projects?|proyectos?)$/],
  ["competencias", /^(competencias( tecnicas)?|habilidades( tecnicas)?|hard skills|skills|conhecimentos( tecnicos)?|tecnologias|ferramentas|technical skills)$/],
  ["softSkills", /^(soft skills|competencias comportamentais|habilidades comportamentais)$/],
  ["idiomas", /^(idiomas?|linguas|languages|lenguas)$/],
  ["certificacoes", /^(certificac(oes|ao)|cursos( complementares)?|certificados|certifications|courses|cursos e certificac(oes|ao))$/],
];

const MES = { jan: "01", fev: "02", feb: "02", mar: "03", abr: "04", apr: "04", mai: "05", may: "05", jun: "06", jul: "07", ago: "08", aug: "08", set: "09", sep: "09", out: "10", oct: "10", nov: "11", dez: "12", dec: "12" };
const PARTE_DATA = String.raw`(?:\d{1,2}\/\d{4}|(?:jan|fev|feb|mar|abr|apr|mai|may|jun|jul|ago|aug|set|sep|out|oct|nov|dez|dec)[a-zç]*\.?\s*(?:de\s*)?\d{4}|\d{4})`;
const FIM_ATUAL = String.raw`(?:atual(?:mente)?|presente|present|o momento|hoje|current|now|actualidad)`;
const RE_PERIODO = new RegExp(`(${PARTE_DATA})\\s*(?:-|–|—|a|ate|até|to)\\s*(${PARTE_DATA}|${FIM_ATUAL})`, "i");

// "09/2025", "set 2025", "setembro de 2025", "2025" -> "2025-09" / "2025"
function mesAno(t) {
  const s = normalizar(t).trim();
  let m = s.match(/^(\d{1,2})\/(\d{4})$/);
  if (m) return `${m[2]}-${m[1].padStart(2, "0")}`;
  m = s.match(/^([a-z]{3})[a-z]*\.?\s*(?:de\s*)?(\d{4})$/);
  if (m && MES[m[1]]) return `${m[2]}-${MES[m[1]]}`;
  m = s.match(/^(\d{4})$/);
  return m ? m[1] : "";
}

function periodo(linha) {
  const m = linha.match(RE_PERIODO);
  if (!m) return null;
  const atual = new RegExp(`^${FIM_ATUAL}$`, "i").test(normalizar(m[2]).trim());
  return { inicio: mesAno(m[1]), fim: atual ? "" : mesAno(m[2]), atual, resto: linha.replace(m[0], "").replace(/[\s|·•,–—-]+$|^[\s|·•,–—-]+/g, "").trim() };
}

const limparTopico = (l) => l.replace(/^[\s•▪◦●○■□➢➤►\-–—*]+/, "").trim();

// No PDF, um parágrafo vira várias linhas. Junta a linha com a anterior quando a frase continua
// (a anterior não termina em pontuação e a atual não começa com marcador nem maiúscula).
function juntarQuebras(linhas) {
  const out = [];
  for (const l of linhas) {
    const ant = out.at(-1);
    if (ant && !/[.!?:;]$/.test(ant) && !/^[•▪◦●○■□➢➤►\-–—*]/.test(l) && /^[a-zà-ú0-9(]/.test(l)) out[out.length - 1] = `${ant} ${l}`;
    else out.push(l);
  }
  return out;
}
const descricaoDe = (linhas) => juntarQuebras(linhas).map(limparTopico).filter(Boolean).join("\n");

// Divide o bloco de uma seção em itens: um item começa numa linha com período (datas).
// A linha anterior, se for curta e sem data, é o título do item (ex.: "Analista de Dados" / "Banco X").
function itensComPeriodo(linhas) {
  const itens = [];
  let atual = null;
  let soltas = []; // linhas antes do primeiro item
  linhas.forEach((l) => {
    const p = periodo(l);
    if (p) {
      const titulos = [];
      if (p.resto) titulos.push(p.resto);
      else {
        // Data sozinha na linha: o título (cargo / empresa) são as até 2 linhas curtas logo acima,
        // que tinham ficado no fim do item anterior (ou antes do primeiro item).
        const fonte = atual ? atual.linhas : soltas;
        for (let k = 0; k < 2 && fonte.length && fonte.at(-1).length < 90 && !/^[•▪◦●\-–*]/.test(fonte.at(-1)); k++) titulos.unshift(fonte.pop());
      }
      atual = { titulos, ...p, linhas: [] };
      itens.push(atual);
    } else if (atual) {
      atual.linhas.push(l);
    } else {
      soltas.push(l);
    }
  });
  return itens;
}

// "Empresa | Cargo" / "Cargo - Empresa" / "Cargo na Empresa" / duas linhas -> { a, b }
function doisNomes(titulos) {
  // Com "|" (ex.: "CSS - UFPE | MONITOR") só o "|" separa: o traço pode fazer parte do nome.
  const comBarra = titulos.length === 1 && titulos[0].includes("|");
  const sep = comBarra ? /\s*\|\s*/ : /\s*[|·•]\s*|\s+[–—-]\s+|,\s+|\s+(?:na|no|em|at)\s+/i;
  const partes = (titulos.length > 1 ? titulos : titulos.join(" | ").split(sep)).map((s) => s.trim()).filter(Boolean);
  return [partes[0] || "", partes.slice(1).join(" · ")];
}

const NIVEIS_IDIOMA = [
  ["Nativo", /nativ|native|materna/],
  ["Fluente", /fluent|fluente|c2|proficien/],
  ["Avançado", /avancad|advanced|c1|b2/],
  ["Intermediário", /intermedi|b1/],
  ["Básico", /basic|basico|a1|a2|iniciante/],
];

export function lerCurriculo(texto) {
  const linhas = String(texto || "").replace(/\r/g, "").split("\n").map((l) => l.replace(/\s+/g, " ").trim()).filter(Boolean);
  const tudo = linhas.join("\n");
  const avisos = [];

  // Contatos
  const email = tudo.match(/[\w.+-]+@[\w-]+\.[\w.-]+/)?.[0] || "";
  const telefone = tudo.match(/(?:\+?55\s*)?\(?\d{2}\)?\s*9?\s*\d{4}\s*[.-]?\s*\d{4}/)?.[0]?.trim().replace(/\s*([.-])\s*/, "$1") || "";
  const linkedin = tudo.match(/(?:https?:\/\/)?(?:[a-z]{2,3}\.)?linkedin\.com\/in\/[\w%-]+\/?/i)?.[0] || "";
  const site = tudo.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/[\w-]+/i)?.[0] || "";

  // Nome: primeira linha "limpa" (sem e-mail/telefone/link/título de seção), com 2 a 6 palavras.
  const ehSecao = (l) => SECOES.find(([, re]) => re.test(normalizar(l).replace(/[:\s]+$/, "").trim()))?.[0];
  const nome = linhas.slice(0, 6).find((l) => !/[@\d/]|http|www\./i.test(l) && !ehSecao(l) && l.split(" ").length >= 2 && l.split(" ").length <= 6) || "";

  // Separa o texto pelas seções reconhecidas
  const blocos = {};
  let secao = "inicio";
  for (const l of linhas) {
    const s = ehSecao(l);
    if (s) {
      secao = s;
      blocos[s] ||= [];
      continue;
    }
    (blocos[secao] ||= []).push(l);
  }
  if (Object.keys(blocos).length <= 1) avisos.push("Não reconhecemos os títulos das seções (Experiência, Formação...). Confira e complete o perfil.");

  // Resumo: a seção de resumo ou, sem ela, o parágrafo longo do início
  const inicio = (blocos.inicio || []).filter((l) => l !== nome && !l.includes(email || "\u0000") && !/linkedin|github|^\(?\d{2}\)?\s*\d/i.test(l));
  const resumo = (blocos.resumo || inicio.filter((l) => l.length > 60)).join(" ").trim();

  const experiencias = itensComPeriodo(blocos.experiencias || []).map((it) => {
    const [a, b] = doisNomes(it.titulos);
    // Com "|" (como no nosso modelo) o padrão é "EMPRESA | CARGO"; nos demais, "Cargo" e depois "Empresa".
    const empresaPrimeiro = it.titulos.length === 1 && it.titulos[0].includes("|");
    return {
      id: novoId(),
      cargo: empresaPrimeiro ? b : a,
      empresa: empresaPrimeiro ? a : b,
      local: "",
      inicio: it.inicio,
      fim: it.fim,
      atual: it.atual,
      descricao: descricaoDe(it.linhas),
    };
  });
  if (blocos.experiencias?.length && !experiencias.length) avisos.push("Encontramos a seção de experiência, mas não as datas de cada uma: adicione as experiências manualmente.");

  const formacao = itensComPeriodo(blocos.formacao || []).map((it) => {
    const [a, b] = doisNomes(it.titulos);
    const instituicaoPrimeiro = /universidade|faculdade|instituto|escola|college|university|ufpe|usp|unicamp|fatec|senai|puc/i.test(a);
    return {
      id: novoId(),
      curso: instituicaoPrimeiro ? b : a,
      instituicao: instituicaoPrimeiro ? a : b,
      inicio: it.inicio,
      fim: it.atual ? "" : it.fim,
      status: it.atual ? "Em andamento" : "Concluído",
      descricao: descricaoDe(it.linhas),
    };
  });

  const projetos = itensComPeriodo(blocos.projetos || []).map((it) => ({
    id: novoId(), nome: it.titulos.join(" · "), link: "", inicio: it.inicio, fim: it.atual ? "" : it.fim, tecnologias: "",
    descricao: descricaoDe(it.linhas),
  }));

  const separarLista = (ls) => [...new Set((ls || []).flatMap((l) => l.split(/\s*[|,;•·]\s*/)).map(limparTopico).filter((x) => x && x.length <= 50))];
  const competencias = separarLista(blocos.competencias);
  const softSkills = (blocos.softSkills || []).join(" ").trim();
  const certificacoes = (blocos.certificacoes || []).map(limparTopico).filter(Boolean);

  // Idiomas: nos blocos de idiomas e competências ("Inglês fluente", "Espanhol - intermediário")
  const idiomas = [];
  for (const l of [...(blocos.idiomas || []), ...(blocos.competencias || []).flatMap((x) => x.split(/\s*[|,;]\s*/))]) {
    const n = normalizar(l);
    const idioma = IDIOMAS.find((i) => n.includes(normalizar(i)));
    if (!idioma || idiomas.some((x) => x.idioma === idioma)) continue;
    const nivel = NIVEIS_IDIOMA.find(([, re]) => re.test(n))?.[0] || "Intermediário";
    idiomas.push({ id: novoId(), idioma, nivel });
  }
  const competenciasSemIdioma = competencias.filter((c) => !IDIOMAS.some((i) => normalizar(c).includes(normalizar(i))));

  return {
    perfil: { nome, email, telefone, linkedin, site, resumo, softSkills, competencias: competenciasSemIdioma, experiencias, formacao, projetos, idiomas, certificacoes },
    avisos,
  };
}

// Junta o lido no perfil atual sem apagar nada: campos vazios são preenchidos, listas recebem
// os itens novos (sem repetir).
export function mesclarNoPerfil(perfil, lido) {
  const vazio = (v) => !v || (typeof v === "string" && !v.trim());
  const novo = { ...perfil };
  for (const campo of ["nome", "email", "telefone", "linkedin", "site", "resumo", "softSkills"]) {
    if (vazio(novo[campo]) && !vazio(lido[campo])) novo[campo] = lido[campo];
  }
  const chave = (x) => normalizar(JSON.stringify([x.cargo || x.curso || x.nome || x.idioma || x, x.empresa || x.instituicao || ""]));
  for (const lista of ["experiencias", "formacao", "projetos", "idiomas"]) {
    const existentes = new Set((novo[lista] || []).map(chave));
    novo[lista] = [...(novo[lista] || []), ...(lido[lista] || []).filter((x) => !existentes.has(chave(x)))];
  }
  for (const lista of ["competencias", "certificacoes"]) {
    const existentes = new Set((novo[lista] || []).map(normalizar));
    novo[lista] = [...(novo[lista] || []), ...(lido[lista] || []).filter((x) => !existentes.has(normalizar(x)))];
  }
  return novo;
}
