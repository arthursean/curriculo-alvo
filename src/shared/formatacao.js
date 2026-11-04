// Formatação das descrições (experiências, projetos, formação), guardada como texto simples:
//   • linha com marcador no início vira tópico ("• ", "- " ou "* ")
//   **negrito**, *itálico*, __sublinhado__   (\* e \_ para o caractere literal)
// Texto simples mantém o algoritmo de personalização e a tradução funcionando sem HTML.

const RE_TOPICO = /^\s*(?:[•▪◦●–-]|\*(?=\s))\s+/;
export const MARCA_TOPICO = "• ";

export const ehTopico = (linha) => RE_TOPICO.test(linha);
export const tirarTopico = (linha) => linha.replace(RE_TOPICO, "");

// Quebra uma linha em pedaços com o estilo de cada um: [{ t, b, i, u }].
export function partesInline(texto) {
  const partes = [];
  const estilo = { b: false, i: false, u: false };
  let atual = "";
  const fechar = () => {
    if (atual) partes.push({ t: atual, ...estilo });
    atual = "";
  };
  const s = String(texto || "");
  for (let k = 0; k < s.length; k++) {
    const c = s[k];
    if (c === "\\" && (s[k + 1] === "*" || s[k + 1] === "_" || s[k + 1] === "\\")) {
      atual += s[++k];
    } else if (c === "*" && s[k + 1] === "*") {
      fechar();
      estilo.b = !estilo.b;
      k++;
    } else if (c === "_" && s[k + 1] === "_") {
      fechar();
      estilo.u = !estilo.u;
      k++;
    } else if (c === "*") {
      fechar();
      estilo.i = !estilo.i;
    } else {
      atual += c;
    }
  }
  fechar();
  return partes;
}

// Texto sem as marcas de estilo (mantém as linhas e os marcadores de tópico).
export const semEstilo = (texto) =>
  String(texto || "")
    .split("\n")
    .map((l) => partesInline(l).map((p) => p.t).join(""))
    .join("\n");

// Escapa o texto digitado para não ser lido como marca.
export const escaparMarcas = (texto) => String(texto).replace(/\\/g, "\\\\").replace(/\*/g, "\\*").replace(/_/g, "\\_");

// Monta a linha a partir dos pedaços (inverso de partesInline).
export function montarInline(partes) {
  let out = "";
  let ant = { b: false, i: false, u: false };
  const trocas = (de, para) => {
    let m = "";
    // fecha na ordem inversa da abertura: sublinhado, itálico, negrito
    if (de.u && !para.u) m += "__";
    if (de.i && !para.i) m += "*";
    if (de.b && !para.b) m += "**";
    if (!de.b && para.b) m += "**";
    if (!de.i && para.i) m += "*";
    if (!de.u && para.u) m += "__";
    return m;
  };
  for (const p of partes) {
    if (!p.t) continue;
    out += trocas(ant, p) + escaparMarcas(p.t);
    ant = p;
  }
  return out + trocas(ant, { b: false, i: false, u: false });
}
