// Algoritmo próprio de personalização: roda no navegador, sem IA e sem custo por uso.
// Ideia geral:
//  1. achar as skills que a vaga pede, usando a taxonomia de lib/skills.js (sinônimos PT/EN + hierarquia);
//  2. dar peso a cada uma (aparece no título, quantas vezes, se está em "requisitos" ou "diferenciais");
//  3. cruzar com o perfil em três níveis:
//       direto    — você tem a skill pedida;
//       implícito — você tem uma skill mais específica que a implica (PostgreSQL atende "SQL");
//       parecido  — você tem uma skill irmã (vaga pede MySQL, você tem PostgreSQL) ou o "pai" dela;
//  4. reescrever o currículo com isso: título, resumo, ordem de competências/experiências/tópicos,
//     anotações como "PostgreSQL (SQL)" e palavras-chave em negrito. Nada é inventado.
import { diasDesde, normalizar } from "./texto";
import { classificarNivel } from "./vagas";
import { SKILLS, ancestrais, ehAmplo, paiEmComum } from "./skills";

const IDIOMAS = [["Inglês", "ingles", "english"], ["Espanhol", "espanhol", "spanish"], ["Francês", "frances", "french"], ["Alemão", "alemao", "german", "deutsch"]];
const NIVEL_IDIOMA = { "Básico": 1, "Intermediário": 2, "Avançado": 3, "Fluente": 4, "Nativo": 5 };
const CREDITO = { direto: 1, implicito: 1, parecido: 0.5, falta: 0 };

// Palavras que indicam o trecho de requisitos obrigatórios da vaga.
const MARCA_REQUISITO = /(requisitos|requirements|obrigatorio|must have|o que esperamos|what you.?ll need|qualificacoes|qualifications|voce precisa|exigencias)/;
const MARCA_DIFERENCIAL = /(diferencia|nice to have|desejavel|bonus|plus|preferred)/;

function linhas(texto = "") {
  return String(texto)
    .split(/\n|•|;|(?<=\.)\s+(?=[A-ZÀ-Ú])/)
    .map((l) => l.replace(/^[-*\s]+/, "").trim())
    .filter(Boolean);
}

// Expressão que acha o termo como palavra inteira, aceitando plural ("estoque" casa "estoques").
const cacheRe = new Map();
function regexTermo(termo) {
  if (!cacheRe.has(termo)) {
    const corpo = normalizar(termo)
      .split(/\s+/)
      .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + (/^[a-z]{4,}$/.test(w) ? "(?:e?s)?" : ""))
      .join("\\s+");
    // Ponto conta como parte da palavra ("js" não casa dentro de "node.js"), exceto no fim de frase.
    cacheRe.set(termo, new RegExp(`(^|[^a-z0-9.])${corpo}(?![a-z0-9]|\\.[a-z0-9])`, "g"));
  }
  return cacheRe.get(termo);
}

// O mesmo texto (descrição da vaga, perfil) é testado contra centenas de termos: normaliza uma vez só.
const cacheNorm = new Map();
function normalizado(texto) {
  let n = cacheNorm.get(texto);
  if (n === undefined) {
    if (cacheNorm.size > 3000) cacheNorm.clear();
    n = normalizar(texto);
    cacheNorm.set(texto, n);
  }
  return n;
}

function aparicoes(texto, termo) {
  return (normalizado(String(texto ?? "")).match(regexTermo(termo)) || []).length;
}
const temAlguma = (texto, formas) => formas.some((f) => aparicoes(texto, f));

// Mesma busca, mas no texto original (com acentos), para poder anotar o texto sem estragá-lo.
const ACENTOS = { a: "[aáàâã]", e: "[eéê]", i: "[ií]", o: "[oóôõ]", u: "[uúü]", c: "[cç]" };
function regexOriginal(forma) {
  const corpo = normalizar(forma).replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/[aeiouc]/g, (l) => ACENTOS[l]);
  return new RegExp(`(?<![\\p{L}\\d.])${corpo}(?![\\p{L}\\d]|\\.[\\p{L}\\d])`, "iu");
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

// Universo de skills: a taxonomia + competências do perfil que não estão nela.
function universoDeSkills(perfil) {
  const extras = perfil.competencias
    .filter((c) => !SKILLS.some((s) => temAlguma(c, s.formas)))
    .map((c) => ({ nome: c, formas: [c], pais: [], amplo: false, propria: true }));
  return [...SKILLS, ...extras];
}

// Quais skills o perfil tem, e de onde vieram (lista de competências ou texto das experiências).
function skillsDoPerfil(perfil, universo) {
  const textoLivre = [
    perfil.titulo, perfil.resumo, perfil.certificacoes.join("\n"),
    ...perfil.experiencias.map((e) => `${e.cargo}\n${e.descricao}`), ...perfil.formacao.map((f) => `${f.curso}\n${f.descricao || ""}`),
    ...(perfil.projetos || []).map((p) => `${p.nome}\n${p.tecnologias}\n${p.descricao}`),
  ].join("\n");
  const tem = new Map(); // nome -> { origem, exibir }
  for (const s of universo) {
    const daLista = perfil.competencias.find((c) => temAlguma(c, s.formas));
    if (daLista) tem.set(s.nome, { origem: "lista", exibir: s.propria ? daLista : s.nome });
    else if (temAlguma(textoLivre, s.formas)) tem.set(s.nome, { origem: "texto", exibir: s.nome });
  }
  // Skills implícitas: todo ancestral de algo que você tem. Guarda "via" qual skill (prefere a da lista).
  const implicadas = new Map();
  const ordem = [...tem.entries()].sort((a, b) => (a[1].origem === "lista" ? -1 : 1) - (b[1].origem === "lista" ? -1 : 1));
  for (const [nome] of ordem) {
    for (const a of ancestrais(nome)) if (!tem.has(a) && !implicadas.has(a)) implicadas.set(a, nome);
  }
  return { tem, implicadas, textoLivre };
}

// Lista ponderada do que a vaga pede.
function termosDaVaga(vaga, universo) {
  const titulo = vaga.titulo || "";
  const { requisitos, diferenciais, geral } = secoesDaVaga(vaga.descricao);
  const tudo = `${titulo}\n${vaga.descricao}\n${(vaga.tags || []).join("\n")}`;
  const termos = [];
  for (const s of universo) {
    const conta = (txt) => s.formas.reduce((n, f) => n + aparicoes(txt, f), 0);
    const total = conta(tudo);
    if (!total) continue;
    let peso = Math.min(total, 4);
    if (conta(titulo)) peso += 4;
    if (conta(requisitos)) peso += 3;
    if (conta(diferenciais)) peso += 1;
    if (!conta(requisitos) && !conta(titulo) && conta(geral) === 1) peso = Math.max(1, peso - 1);
    if (s.amplo) peso = Math.max(1, Math.round(peso * 0.6)); // categorias genéricas pesam menos
    termos.push({ ...s, peso, obrigatorio: Boolean(conta(titulo) || conta(requisitos)) });
  }
  return termos.sort((a, b) => b.peso - a.peso).slice(0, 30);
}

// Como o perfil atende cada termo pedido.
function classificar(termo, { tem, implicadas }) {
  if (tem.has(termo.nome)) return { tipo: "direto" };
  if (implicadas.has(termo.nome)) return { tipo: "implicito", via: implicadas.get(termo.nome) };
  if (!termo.amplo && !termo.propria) {
    for (const s of tem.keys()) {
      const pai = paiEmComum(termo.nome, s);
      if (pai) return { tipo: "parecido", via: s, pai };
    }
    // Você tem o "pai" específico da skill pedida (sabe SQL, a vaga pede PostgreSQL).
    for (const a of ancestrais(termo.nome)) if (!ehAmplo(a) && tem.has(a)) return { tipo: "parecido", via: a };
  }
  return { tipo: "falta" };
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

// Experiência mais recente (a atual, ou a que terminou por último).
function maisRecente(experiencias) {
  const chave = (e) => (e.atual ? "9999-99" : e.fim || e.inicio || "");
  return [...experiencias].sort((a, b) => chave(b).localeCompare(chave(a)))[0];
}

// "Azzas | Analista de Dados II | Atacado (f/m/d)" -> "Analista de Dados II"
export function limparTitulo(titulo = "") {
  const semMarcas = titulo.replace(/\((?:[mfwdx]\s*\/\s*){1,3}[mfwdx]\)|\b[mfwd]\/[mfwd](?:\/[mfwdx])?\b/gi, "").trim();
  const partes = semMarcas.split(/\s*[|–—]\s*/).filter(Boolean);
  return (partes.sort((a, b) => b.split(/\s+/).length - a.split(/\s+/).length)[0] || titulo).trim();
}

const listar = (xs) => (xs.length > 1 ? `${xs.slice(0, -1).join(", ")} e ${xs.at(-1)}` : xs[0] || "");
// "Frontend" -> "frontend", mas "JavaScript", "SQL" e "DevOps" ficam como estão.
const minuscula = (t) => (/^[A-ZÀ-Ú][a-zà-ú]+(?:\s[a-zà-ú]+)*$/.test(t) ? t.charAt(0).toLowerCase() + t.slice(1) : t);

// A análise do perfil não depende da vaga: calculada uma vez por objeto de perfil
// (avaliar 200 vagas de uma busca reaproveita o mesmo resultado).
const cachePerfil = new WeakMap();
function analisarPerfil(perfil) {
  let a = cachePerfil.get(perfil);
  if (!a) {
    const universo = universoDeSkills(perfil);
    a = { universo, porNome: new Map(universo.map((s) => [s.nome, s])), doPerfil: skillsDoPerfil(perfil, universo) };
    cachePerfil.set(perfil, a);
  }
  return a;
}

export function personalizar(perfil, vaga) {
  const { universo, porNome, doPerfil } = analisarPerfil(perfil);
  const { tem } = doPerfil;
  const exibir = (nome) => tem.get(nome)?.exibir || nome;

  const termos = termosDaVaga(vaga, universo).map((t) => ({ ...t, ...classificar(t, doPerfil) }));
  const atendidos = termos.filter((t) => t.tipo === "direto" || t.tipo === "implicito");
  const parecidos = termos.filter((t) => t.tipo === "parecido");
  const faltando = termos.filter((t) => t.tipo === "falta");

  // Formas que "cobrem" cada termo no seu texto: a própria skill, ou a sua skill que a implica / é parecida.
  const cobertura = (t) => [...t.formas, ...(t.via ? porNome.get(t.via)?.formas || [] : [])];
  const pontuar = (txt) => termos.reduce((s, t) => s + (CREDITO[t.tipo] && temAlguma(txt, cobertura(t)) ? t.peso * CREDITO[t.tipo] : 0), 0);

  // ---- Competências -------------------------------------------------------------------
  // Peso de uma skill sua para esta vaga: direto, ou pelo que ela implica / pelo parecido.
  const pesoDaSkill = (nome) => {
    let p = 0;
    for (const t of termos) {
      if (t.nome === nome && t.tipo === "direto") p = Math.max(p, t.peso);
      else if (t.via === nome) p = Math.max(p, t.peso * (t.tipo === "implicito" ? 0.9 : 0.5));
    }
    return p;
  };
  const daLista = perfil.competencias.map((c) => {
    const s = universo.find((x) => temAlguma(c, x.formas));
    return { texto: c, nome: s?.nome || c };
  });
  const nomesNaLista = new Set(daLista.map((c) => c.nome));
  // Inferidas: a vaga pede e aparece nas suas experiências, mas faltou na lista de competências.
  const inferidas = atendidos.filter((t) => t.tipo === "direto" && !t.amplo && !t.categoria && !nomesNaLista.has(t.nome)).map((t) => t.nome);
  // Implícitas pedidas pela vaga (ex.: "SQL" para quem tem PostgreSQL) — específicas primeiro.
  const implicitas = atendidos.filter((t) => t.tipo === "implicito" && !t.amplo && !t.categoria).map((t) => t.nome);
  const itensComp = [
    ...daLista.map((c) => ({ texto: c.texto, peso: pesoDaSkill(c.nome) })),
    ...inferidas.map((n) => ({ texto: n, peso: pesoDaSkill(n) })),
    ...implicitas.map((n) => ({ texto: n, peso: termos.find((t) => t.nome === n).peso * 0.95 })),
  ];
  const vistos = new Set();
  const competencias = itensComp
    .filter((c) => !vistos.has(normalizar(c.texto)) && vistos.add(normalizar(c.texto)))
    .sort((a, b) => b.peso - a.peso);
  const destaques = competencias.filter((c) => c.peso > 0).map((c) => c.texto);

  // ---- Experiências e tópicos -------------------------------------------------------
  const tituloVaga = normalizar(vaga.titulo);
  const anotadas = new Set();
  // Anota "PostgreSQL (SQL)" na primeira vez que a sua skill aparece, quando a vaga pede o termo mais amplo.
  const anotar = (linha) => {
    for (const t of atendidos) {
      if (t.tipo !== "implicito" || t.amplo || t.categoria || anotadas.has(t.nome) || temAlguma(linha, t.formas)) continue;
      for (const f of porNome.get(t.via)?.formas || []) {
        const re = regexOriginal(f);
        const m = linha.match(re);
        if (!m) continue;
        anotadas.add(t.nome);
        const fim = m.index + m[0].length;
        return `${linha.slice(0, fim)} (${t.nome})${linha.slice(fim)}`;
      }
    }
    return linha;
  };
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
    // Experiências sem relação com a vaga ficam mais curtas (até 2 tópicos) para dar espaço às relevantes.
    .map(({ _p, _o, ...e }, i) => (_p <= 2 && i > 0 && e.itens.length > 2 ? { ...e, itens: e.itens.slice(0, 2) } : e))
    .map((e) => ({ ...e, itens: e.itens.map(anotar) }));

  // Projetos (opcionais): mesma lógica; tecnologias contam bastante, e os sem relação com a vaga
  // ficam no fim com até 2 tópicos.
  const projetos = (perfil.projetos || [])
    .filter((p) => p.nome?.trim() || p.descricao?.trim())
    .map((p, ordem) => {
      const itens = linhas(p.descricao)
        .map((l, i) => ({ l, i, p: pontuar(l) + (/\d/.test(l) ? 1 : 0) }))
        .sort((a, b) => b.p - a.p || a.i - b.i)
        .map((x) => x.l);
      return { ...p, itens, _p: pontuar(`${p.nome}\n${p.tecnologias}\n${p.descricao}`), _o: ordem };
    })
    .sort((a, b) => b._p - a._p || a._o - b._o)
    .map(({ _p, _o, ...p }, i) => (_p <= 2 && i > 0 && p.itens.length > 2 ? { ...p, itens: p.itens.slice(0, 2) } : p))
    .map((p) => ({ ...p, itens: p.itens.map(anotar) }));

  // Formação: a ordem dos cursos não muda (é cronológica), mas os tópicos da descrição
  // vêm na ordem do que a vaga pede.
  const formacao = perfil.formacao.map((f) => ({
    ...f,
    itens: linhas(f.descricao)
      .map((l, i) => ({ l, i, p: pontuar(l) }))
      .sort((a, b) => b.p - a.p || a.i - b.i)
      .map((x) => anotar(x.l)),
  }));

  // ---- Compatibilidade ----------------------------------------------------------------
  const pesoTotal = termos.reduce((s, t) => s + t.peso * (t.obrigatorio ? 1.5 : 1), 0);
  const pesoAtendido = termos.reduce((s, t) => s + t.peso * (t.obrigatorio ? 1.5 : 1) * CREDITO[t.tipo], 0);
  let compatibilidade = pesoTotal ? Math.round((pesoAtendido / pesoTotal) * 100) : 50;

  const rotuloAtendido = (t) => (t.tipo === "implicito" ? `${t.nome} (via ${exibir(t.via)})` : exibir(t.nome));
  const listaAtendidos = atendidos.map(rotuloAtendido);
  // Categorias genéricas ("Jurídico", "Finanças") contam na compatibilidade, mas não ajudam como lacuna.
  const listaLacunas = faltando.filter((t) => !t.amplo).map((t) => t.nome);

  // Idiomas exigidos.
  const dicas = [];
  const textoVaga = `${vaga.titulo}\n${vaga.descricao}`;
  for (const [nome, ...formas] of IDIOMAS) {
    if (!formas.some((f) => aparicoes(textoVaga, f))) continue;
    const meu = perfil.idiomas.find((i) => normalizar(i.idioma).includes(normalizar(nome).slice(0, 5)));
    if (!meu) {
      listaLacunas.unshift(nome);
      compatibilidade = Math.max(0, compatibilidade - 10);
    } else if (NIVEL_IDIOMA[meu.nivel] >= 3) {
      listaAtendidos.push(`${nome} ${meu.nivel.toLowerCase()}`);
    }
  }

  // ---- Dicas ----------------------------------------------------------------------------
  if (inferidas.length) {
    dicas.push(`Incluímos ${listar(inferidas.slice(0, 4))} nas competências porque aparecem nas suas experiências. Vale adicioná-las ao perfil também.`);
  }
  const p1 = parecidos.find((t) => t.obrigatorio) || parecidos[0];
  if (p1) dicas.push(`A vaga pede ${p1.nome} e você tem ${exibir(p1.via)}: diga na entrevista ou na carta que os conceitos são os mesmos e que a adaptação é rápida.`);
  const anos = anosDeExperiencia(perfil.experiencias);
  const nivelVaga = classificarNivel(vaga.titulo, vaga.descricao);
  if (nivelVaga === "senior" && anos < 5) dicas.push(`A vaga é sênior e seu perfil soma cerca de ${anos} ano(s): destaque projetos complexos e responsabilidades de referência técnica.`);
  if (nivelVaga === "lideranca" && !tem.has("Liderança")) {
    dicas.push("A vaga é de liderança: inclua no perfil experiências em que você coordenou pessoas, projetos ou decisões.");
  }
  if ((nivelVaga === "junior" || nivelVaga === "estagio") && anos >= 5) dicas.push("Você tem mais experiência do que a vaga pede: deixe claro no contato por que esta posição te interessa.");
  const obrigatoriasFaltando = faltando.filter((t) => t.obrigatorio && !t.amplo).map((t) => t.nome);
  if (obrigatoriasFaltando.length) {
    dicas.push(`Requisitos da vaga que não aparecem no seu perfil: ${listar(obrigatoriasFaltando.slice(0, 4))}. Se você já usou algum deles, adicione ao perfil e gere de novo.`);
  }
  if (perfil.experiencias.some((e) => linhas(e.descricao).length < 2)) {
    dicas.push("Descreva cada experiência em tópicos com resultados (números, prazos, impacto): eles são priorizados conforme a vaga.");
  }
  if (diasDesde(vaga.publicadaEm) > 20) dicas.push("A vaga foi publicada há mais de 20 dias: confirme se ainda está aberta antes de se candidatar.");

  // ---- Resumo, montado com fatos do perfil --------------------------------------------
  const recente = maisRecente(perfil.experiencias);
  const partes = [];
  if (perfil.resumo?.trim()) {
    partes.push(perfil.resumo.trim().replace(/([^.!?])$/, "$1."));
  } else {
    const titulo = perfil.titulo || recente?.cargo || "Profissional";
    let abertura = anos >= 1 ? `${titulo} com ${anos} ano${anos > 1 ? "s" : ""} de experiência` : titulo;
    if (recente?.empresa) {
      const quando = recente.atual ? "atualmente" : "mais recentemente";
      abertura += normalizar(recente.cargo) === normalizar(titulo) ? `, ${quando} na ${recente.empresa}` : `, ${quando} como ${recente.cargo} na ${recente.empresa}`;
    }
    partes.push(`${abertura}.`);
  }
  // Fala a língua da vaga: "SQL (PostgreSQL)" quando a vaga pede SQL e você tem PostgreSQL.
  // Cada skill sua aparece uma vez só; categorias ("Ferramenta de BI") viram o nome da sua skill ("Power BI").
  const usadas = new Set();
  const fortes = [];
  for (const t of atendidos) {
    if (fortes.length >= 4) break;
    if (t.amplo || (t.categoria && t.tipo === "direto")) continue;
    const minha = t.tipo === "implicito" ? t.via : t.nome;
    if (usadas.has(minha)) continue;
    usadas.add(minha);
    fortes.push(t.tipo === "implicito" && !t.categoria && !t.amplo ? `${minuscula(t.nome)} (${exibir(t.via)})` : exibir(minha));
  }
  if (fortes.length) partes.push(`Experiência prática com ${listar(fortes)}, competências centrais para a posição de ${limparTitulo(vaga.titulo)}.`);
  // Resultado citado: o tópico com número mais ligado à vaga.
  const resultado = [...experiencias, ...projetos]
    .flatMap((e) => e.itens || [])
    .filter((l) => /\d/.test(l))
    .map((l, i) => ({ l, p: pontuar(l) - i * 0.01 }))
    .filter((x) => x.p > 0)
    .sort((a, b) => b.p - a.p)[0]?.l;
  if (resultado) partes.push(`Entre os resultados: ${resultado.charAt(0).toLowerCase()}${resultado.slice(1).replace(/\.$/, "")}.`);
  const resumo = partes.join(" ");

  // Título com as 3 competências mais pedidas que você tem (ex.: "Analista de Dados | SQL · Power BI · Python").
  const base = perfil.titulo || recente?.cargo || "";
  const titulo = destaques.length ? `${base}${base ? " | " : ""}${destaques.slice(0, 3).join(" · ")}` : base;

  // Palavras a destacar em negrito: o que você tem que a vaga pede (inclusive "via").
  const palavras = [...new Set(atendidos.flatMap((t) => [t.nome, ...cobertura(t)]).filter((p) => p.length > 2 || /^[A-Z]{2}$/.test(p)))];

  return {
    titulo,
    resumo,
    competencias: competencias.map((c) => c.texto),
    destaques,
    palavras,
    experiencias,
    projetos,
    formacao,
    compatibilidade: Math.max(0, Math.min(100, compatibilidade)),
    atendidos: listaAtendidos,
    relacionados: parecidos.map((t) => `${t.nome} (você tem ${exibir(t.via)})`),
    lacunas: listaLacunas.slice(0, 10),
    dicas,
  };
}
