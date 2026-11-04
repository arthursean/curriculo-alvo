"use client";
import { NOMES, detectarIdiomaPerfil } from "@/shared/traducao";
import { MARCA_TOPICO, ehTopico, montarInline, partesInline, tirarTopico } from "@/shared/formatacao";

// Tópico do currículo: vai para o tradutor só o texto (sem marcas). O marcador de tópico volta
// sempre; o estilo volta quando a linha inteira tem um só (ex.: toda em negrito).
function separarItem(item) {
  const topico = ehTopico(item);
  const partes = partesInline(topico ? tirarTopico(item) : item);
  const texto = partes.map((p) => p.t).join("");
  const unico = partes.length && partes.every((p) => p.b === partes[0].b && p.i === partes[0].i && p.u === partes[0].u) ? partes[0] : null;
  return { topico, texto, remontar: (t) => (topico ? MARCA_TOPICO : "") + (unico ? montarInline([{ ...unico, t }]) : montarInline([{ t }])) };
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
// Sempre parte do texto ORIGINAL (no idioma em que o perfil foi escrito, `de`), nunca de uma
// tradução anterior: trocar de inglês para espanhol traduz de novo a partir do original.
export async function traduzirCurriculo(perfil, ajuste, para, aoProgresso, de = detectarIdiomaPerfil(perfil)) {
  if (para === de) return { perfil, ajuste, motor: null };
  const motor = (await tradutorDoNavegador(de, para, aoProgresso)) || myMemory(de, para);

  // Junta todos os textos, traduz sem repetir e remonta.
  const textos = new Set();
  const add = (t) => t && String(t).trim() && textos.add(String(t));
  add(ajuste.titulo); add(ajuste.resumo);
  ajuste.competencias.filter(traduzivel).forEach(add);
  const addItem = (it) => add(separarItem(it).texto);
  ajuste.experiencias.forEach((e) => { add(e.cargo); e.itens?.forEach(addItem); });
  (ajuste.projetos || []).forEach((p) => p.itens?.forEach(addItem)); // nome do projeto não se traduz
  perfil.formacao.forEach((f) => add(f.curso));
  (ajuste.formacao || []).forEach((f) => f.itens?.forEach(addItem));
  perfil.idiomas.forEach((i) => { if (!NOMES[i.idioma]) add(i.idioma); });
  add(perfil.softSkills);

  const lista = [...textos];
  const mapa = new Map();
  for (let i = 0; i < lista.length; i++) {
    aoProgresso?.(`Traduzindo (${motor.nome})… ${i + 1}/${lista.length}`);
    mapa.set(lista[i], limpar(lista[i], await motor.traduzir(lista[i])));
  }
  const tr = (t) => (t ? mapa.get(String(t)) ?? t : t);
  const trItem = (it) => {
    const { texto, remontar } = separarItem(it);
    return texto.trim() ? remontar(tr(texto)) : it;
  };

  return {
    motor: motor.nome,
    perfil: {
      ...perfil,
      formacao: perfil.formacao.map((f) => ({ ...f, curso: tr(f.curso) })),
      idiomas: perfil.idiomas.map((i) => ({ ...i, idioma: NOMES[i.idioma] ? i.idioma : tr(i.idioma) })),
      softSkills: tr(perfil.softSkills),
    },
    ajuste: {
      ...ajuste,
      titulo: tr(ajuste.titulo),
      resumo: tr(ajuste.resumo),
      competencias: ajuste.competencias.map(tr),
      destaques: ajuste.destaques.map(tr),
      experiencias: ajuste.experiencias.map((e) => ({ ...e, cargo: tr(e.cargo), itens: e.itens?.map(trItem) })),
      projetos: (ajuste.projetos || []).map((p) => ({ ...p, itens: p.itens?.map(trItem) })),
      formacao: (ajuste.formacao || perfil.formacao).map((f) => ({ ...f, curso: tr(f.curso), itens: f.itens?.map(trItem) })),
      palavras: [...new Set([...ajuste.palavras, ...ajuste.destaques.map(tr)])],
    },
  };
}
