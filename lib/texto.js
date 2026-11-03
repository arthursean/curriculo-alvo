export function semHtml(html = "") {
  return String(html)
    .replace(/<\s*(br|\/p|\/li|\/div|\/h\d)\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n")
    .trim();
}

export function normalizar(s = "") {
  return String(s)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

export function contem(texto, termo) {
  const t = normalizar(termo).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  if (!t) return false;
  return new RegExp(`(^|[^a-z0-9.])${t}(?![a-z0-9]|\\.[a-z0-9])`).test(normalizar(texto));
}

export function diasDesde(data) {
  const ms = Date.now() - new Date(data).getTime();
  return Math.max(0, Math.floor(ms / 86400000));
}

export function tempoRelativo(data) {
  const d = diasDesde(data);
  if (d === 0) return "hoje";
  if (d === 1) return "ontem";
  if (d < 30) return `há ${d} dias`;
  const m = Math.floor(d / 30);
  return m === 1 ? "há 1 mês" : `há ${m} meses`;
}
