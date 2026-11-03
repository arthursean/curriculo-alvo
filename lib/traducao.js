import { normalizar } from "./texto";

export const IDIOMAS_CV = [
  { id: "pt", nome: "Português" },
  { id: "en", nome: "Inglês" },
  { id: "es", nome: "Espanhol" },
  { id: "fr", nome: "Francês" },
  { id: "de", nome: "Alemão" },
];

// Nomes de idiomas do perfil nas outras línguas (os demais são traduzidos junto com o texto).
const NOMES = {
  "Inglês": { en: "English", es: "Inglés", fr: "Anglais", de: "Englisch" },
  "Espanhol": { en: "Spanish", es: "Español", fr: "Espagnol", de: "Spanisch" },
  "Português": { en: "Portuguese", es: "Portugués", fr: "Portugais", de: "Portugiesisch" },
  "Francês": { en: "French", es: "Francés", fr: "Français", de: "Französisch" },
  "Alemão": { en: "German", es: "Alemán", fr: "Allemand", de: "Deutsch" },
  "Italiano": { en: "Italian", es: "Italiano", fr: "Italien", de: "Italienisch" },
  "Mandarim": { en: "Mandarin", es: "Mandarín", fr: "Mandarin", de: "Mandarin" },
  "Japonês": { en: "Japanese", es: "Japonés", fr: "Japonais", de: "Japanisch" },
  "Libras": { en: "Brazilian Sign Language (Libras)", es: "Lengua de Señas Brasileña (Libras)", fr: "Langue des signes brésilienne (Libras)", de: "Brasilianische Gebärdensprache (Libras)" },
};

function rotulos(id, t) {
  return { ...t, nomeIdioma: (n) => (id === "pt" ? n : NOMES[n]?.[id] || n) };
}

export const ROTULOS = {
  pt: rotulos("pt", {
    seuNome: "Seu nome", resumo: "Resumo profissional", competencias: "Competências", experiencia: "Experiência profissional",
    formacao: "Formação acadêmica", idiomasCert: "Idiomas e certificações", atual: "atual",
    status: { "Em andamento": "Em andamento", "Trancado": "Trancado" },
    nivel: {},
  }),
  en: rotulos("en", {
    seuNome: "Your name", resumo: "Professional summary", competencias: "Skills", experiencia: "Professional experience",
    formacao: "Education", idiomasCert: "Languages and certifications", atual: "present",
    status: { "Em andamento": "In progress", "Trancado": "On hold" },
    nivel: { "Básico": "Basic", "Intermediário": "Intermediate", "Avançado": "Advanced", "Fluente": "Fluent", "Nativo": "Native" },
  }),
  es: rotulos("es", {
    seuNome: "Su nombre", resumo: "Resumen profesional", competencias: "Competencias", experiencia: "Experiencia profesional",
    formacao: "Formación académica", idiomasCert: "Idiomas y certificaciones", atual: "actual",
    status: { "Em andamento": "En curso", "Trancado": "Interrumpido" },
    nivel: { "Básico": "Básico", "Intermediário": "Intermedio", "Avançado": "Avanzado", "Fluente": "Fluido", "Nativo": "Nativo" },
  }),
  fr: rotulos("fr", {
    seuNome: "Votre nom", resumo: "Profil professionnel", competencias: "Compétences", experiencia: "Expérience professionnelle",
    formacao: "Formation", idiomasCert: "Langues et certifications", atual: "aujourd’hui",
    status: { "Em andamento": "En cours", "Trancado": "Interrompu" },
    nivel: { "Básico": "Notions", "Intermediário": "Intermédiaire", "Avançado": "Avancé", "Fluente": "Courant", "Nativo": "Langue maternelle" },
  }),
  de: rotulos("de", {
    seuNome: "Ihr Name", resumo: "Profil", competencias: "Kenntnisse", experiencia: "Berufserfahrung",
    formacao: "Ausbildung", idiomasCert: "Sprachen und Zertifikate", atual: "heute",
    status: { "Em andamento": "Laufend", "Trancado": "Unterbrochen" },
    nivel: { "Básico": "Grundkenntnisse", "Intermediário": "Gute Kenntnisse", "Avançado": "Sehr gute Kenntnisse", "Fluente": "Fließend", "Nativo": "Muttersprache" },
  }),
};

// Palavras muito comuns de cada língua; vence a que aparece mais no texto da vaga.
const MARCADORES = {
  pt: ["de", "que", "com", "uma", "nao", "voce", "para", "sao", "ao", "em", "experiencia", "vaga", "conhecimento"],
  en: ["the", "and", "you", "with", "for", "our", "will", "are", "experience", "we", "your", "of"],
  es: ["el", "los", "las", "con", "una", "y", "del", "usted", "experiencia", "para", "en", "conocimiento"],
  fr: ["et", "les", "des", "vous", "pour", "avec", "nous", "une", "est", "votre", "du"],
  de: ["und", "der", "die", "mit", "wir", "sie", "fur", "das", "ist", "zu", "ihre", "den"],
};

export function detectarIdioma(texto) {
  const palavras = normalizar(texto).slice(0, 6000).split(/[^a-z]+/);
  const contagem = Object.fromEntries(Object.keys(MARCADORES).map((l) => [l, 0]));
  const conjuntos = Object.fromEntries(Object.entries(MARCADORES).map(([l, ws]) => [l, new Set(ws)]));
  for (const p of palavras) for (const l in conjuntos) if (conjuntos[l].has(p)) contagem[l]++;
  return Object.entries(contagem).sort((a, b) => b[1] - a[1])[0][0];
}

// ---- Tradução sem custo -------------------------------------------------------------
// 1º: tradutor embutido do navegador (Chrome 138+): roda no aparelho, nada sai do computador.
// 2º: MyMemory (serviço gratuito), chamado direto do navegador do usuário — a cota é por usuário.

// Alguns navegadores anunciam o tradutor mas nunca respondem: tudo com prazo, e na falha cai no MyMemory.
function comPrazo(promessa, ms) {
  return Promise.race([promessa, new Promise((_, rej) => setTimeout(() => rej(new Error("prazo")), ms))]);
}

async function tradutorDoNavegador(de, para, aoProgresso) {
  if (typeof self === "undefined" || !("Translator" in self)) return null;
  try {
    const disp = await comPrazo(self.Translator.availability({ sourceLanguage: de, targetLanguage: para }), 3000);
    if (disp === "unavailable") return null;
    const t = await comPrazo(self.Translator.create({
      sourceLanguage: de,
      targetLanguage: para,
      monitor(m) {
        m.addEventListener("downloadprogress", (e) => aoProgresso?.(`Baixando o tradutor do navegador… ${Math.round(e.loaded * 100)}%`));
      },
    }), disp === "available" ? 5000 : 60000);
    const traduzir = (txt) => comPrazo(t.translate(txt), 15000);
    await traduzir("teste"); // confirma que funciona antes de usar
    return { nome: "tradutor do navegador", traduzir };
  } catch {
    return null;
  }
}

function pedacos(texto, max = 450) {
  if (texto.length <= max) return [texto];
  const frases = texto.match(/[^.!?]+[.!?]*\s*/g) || [texto];
  const out = [];
  let atual = "";
  for (const f of frases) {
    if ((atual + f).length > max && atual) {
      out.push(atual);
      atual = "";
    }
    atual += f;
  }
  if (atual) out.push(atual);
  return out;
}

const myMemory = (de, para) => ({
  nome: "MyMemory",
  async traduzir(texto) {
    const partes = [];
    for (const p of pedacos(texto)) {
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(p)}&langpair=${de}|${para}`;
      const r = await fetch(url).then((x) => x.json());
      if (r.quotaFinished || r.responseStatus !== 200) throw new Error("Limite diário do tradutor gratuito atingido. Tente amanhã ou use o Google Chrome atualizado.");
      partes.push(r.responseData.translatedText);
    }
    return partes.join(" ");
  },
});

// Remove sujeira que tradutores automáticos às vezes devolvem (tags, entidades, ponto final inventado).
function limpar(original, traduzido) {
  let t = String(traduzido)
    .replace(/\\?&lt;\/?[a-z]+\\?&gt;/gi, "")
    .replace(/\\?<\/?[a-z]+\\?>/gi, "")
    .replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/\\/g, "")
    .trim();
  if (!/[.!?]$/.test(original.trim())) t = t.replace(/[.。]+$/, "");
  return t || original;
}

// Nomes de ferramentas e tecnologias (uma palavra, sem acento: React, Git, Excel) não se traduzem.
const traduzivel = (t) => /\s/.test(t.trim()) || /[^\x00-\x7F]/.test(t);

// Traduz o perfil e o ajuste de uma vez. Devolve versões novas, sem alterar as originais.
export async function traduzirCurriculo(perfil, ajuste, para, aoProgresso) {
  const de = "pt";
  if (para === de) return { perfil, ajuste, motor: null };
  const motor = (await tradutorDoNavegador(de, para, aoProgresso)) || myMemory(de, para);

  // Junta todos os textos, traduz sem repetir e remonta.
  const textos = new Set();
  const add = (t) => t && String(t).trim() && textos.add(String(t));
  add(ajuste.titulo); add(ajuste.resumo);
  ajuste.competencias.filter(traduzivel).forEach(add);
  ajuste.experiencias.forEach((e) => { add(e.cargo); e.itens?.forEach(add); });
  perfil.formacao.forEach((f) => add(f.curso));
  perfil.idiomas.forEach((i) => { if (!NOMES[i.idioma]) add(i.idioma); });

  const lista = [...textos];
  const mapa = new Map();
  for (let i = 0; i < lista.length; i++) {
    aoProgresso?.(`Traduzindo (${motor.nome})… ${i + 1}/${lista.length}`);
    mapa.set(lista[i], limpar(lista[i], await motor.traduzir(lista[i])));
  }
  const tr = (t) => (t ? mapa.get(String(t)) ?? t : t);

  return {
    motor: motor.nome,
    perfil: {
      ...perfil,
      formacao: perfil.formacao.map((f) => ({ ...f, curso: tr(f.curso) })),
      idiomas: perfil.idiomas.map((i) => ({ ...i, idioma: NOMES[i.idioma] ? i.idioma : tr(i.idioma) })),
    },
    ajuste: {
      ...ajuste,
      titulo: tr(ajuste.titulo),
      resumo: tr(ajuste.resumo),
      competencias: ajuste.competencias.map(tr),
      destaques: ajuste.destaques.map(tr),
      experiencias: ajuste.experiencias.map((e) => ({ ...e, cargo: tr(e.cargo), itens: e.itens?.map(tr) })),
      palavras: [...new Set([...ajuste.palavras, ...ajuste.destaques.map(tr)])],
    },
  };
}
