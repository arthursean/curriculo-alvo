// Idiomas do currículo: rótulos fixos por língua e detecção do idioma de um texto.
// Usado no servidor (marcar o idioma de cada vaga) e no navegador (exibir o currículo).
import { normalizar } from "./texto";

export const IDIOMAS_CV = [
  { id: "pt", nome: "Português" },
  { id: "en", nome: "Inglês" },
  { id: "es", nome: "Espanhol" },
  { id: "fr", nome: "Francês" },
  { id: "de", nome: "Alemão" },
];

// Nomes de idiomas do perfil nas outras línguas (os demais são traduzidos junto com o texto).
export const NOMES = {
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
