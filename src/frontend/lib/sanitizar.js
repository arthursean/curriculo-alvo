"use client";

// O currículo editado é guardado como HTML e mostrado de novo depois. Para que nada perigoso
// (scripts, links, imagens, eventos onclick, estilos) entre por colagem ou edição, só passam as
// tags de texto e as classes do próprio layout do currículo; todo o resto é removido.
const TAGS = new Set(["ARTICLE", "HEADER", "SECTION", "DIV", "SPAN", "P", "H1", "H2", "H3", "UL", "OL", "LI", "STRONG", "B", "EM", "I", "U", "BR", "HR", "A"]);
const CLASSES = new Set([
  "cv", "cv-contato", "cv-resumo", "cv-item", "cv-item-titulo", "cv-item-sub", "cv-item-texto", "cv-hard", "cv-soft",
  // layout antigo (currículos formatados antes da mudança de modelo)
  "cargo", "contato", "exp", "exp-topo", "periodo", "skills", "skill", "destaque",
]);
// Links dos contatos: só e-mail e http(s). "javascript:" e afins são removidos.
const HREF_SEGURO = /^(mailto:[^\s@]+@[^\s@]+|https?:\/\/[^\s"'<>]+)$/i;
// Tags que somem junto com o conteúdo (o resto só perde a tag e mantém o texto).
const DESCARTAR = new Set(["SCRIPT", "STYLE", "IFRAME", "OBJECT", "EMBED", "TEMPLATE", "NOSCRIPT", "SVG", "MATH", "IMG", "VIDEO", "AUDIO", "FORM", "INPUT", "BUTTON", "TEXTAREA", "SELECT", "LINK", "META"]);

function limparNo(no) {
  for (const filho of [...no.childNodes]) {
    if (filho.nodeType === Node.TEXT_NODE) continue;
    if (filho.nodeType !== Node.ELEMENT_NODE) {
      filho.remove(); // comentários etc.
      continue;
    }
    if (DESCARTAR.has(filho.tagName)) {
      filho.remove();
      continue;
    }
    limparNo(filho);
    if (!TAGS.has(filho.tagName)) {
      filho.replaceWith(...filho.childNodes); // ex.: <font>, <img>: fica só o texto
      continue;
    }
    for (const attr of [...filho.attributes]) {
      if (attr.name === "class") {
        const ok = attr.value.split(/\s+/).filter((c) => CLASSES.has(c));
        if (ok.length) filho.setAttribute("class", ok.join(" "));
        else filho.removeAttribute("class");
      } else if (attr.name === "href" && filho.tagName === "A" && HREF_SEGURO.test(attr.value.trim())) {
        filho.setAttribute("href", attr.value.trim());
      } else if (!(attr.name === "lang" && /^[a-z]{2}$/.test(attr.value))) {
        filho.removeAttribute(attr.name);
      }
    }
  }
}

export function sanitizarHtml(html) {
  const doc = new DOMParser().parseFromString(`<div>${html || ""}</div>`, "text/html");
  const raiz = doc.body.firstElementChild;
  limparNo(raiz);
  return raiz.innerHTML;
}
