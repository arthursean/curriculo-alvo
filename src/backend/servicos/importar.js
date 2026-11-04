import "server-only";
import { ErroApp, muitasTentativas } from "@/backend/http/erros";
import { excedeuLimite } from "@/backend/auth/limite";
import { lerCurriculo } from "@/shared/importar";

export const TAMANHO_MAXIMO = 3 * 1024 * 1024;
const MAX_PAGINAS = 10;

async function textoDoPdf(bytes) {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  // Registrar o worker no globalThis evita o import dinâmico por caminho (que some no deploy).
  if (!globalThis.pdfjsWorker) globalThis.pdfjsWorker = await import("pdfjs-dist/legacy/build/pdf.worker.mjs");
  const doc = await pdfjs.getDocument({ data: bytes, isEvalSupported: false, disableFontFace: true, useSystemFonts: false }).promise;
  try {
    let texto = "";
    for (let p = 1; p <= Math.min(doc.numPages, MAX_PAGINAS); p++) {
      const conteudo = await (await doc.getPage(p)).getTextContent();
      for (const it of conteudo.items) texto += (it.str || "") + (it.hasEOL ? "\n" : "");
      texto += "\n";
    }
    return texto;
  } finally {
    await doc.destroy();
  }
}

async function textoDoDocx(bytes) {
  const mammoth = (await import("mammoth")).default;
  const { value } = await mammoth.extractRawText({ buffer: Buffer.from(bytes) });
  return value;
}

// Descobre o tipo pelo conteúdo (assinatura do arquivo), não pelo nome que o usuário mandou.
function tipoDe(bytes) {
  const ini = String.fromCharCode(...bytes.slice(0, 5));
  if (ini === "%PDF-") return "pdf";
  if (bytes[0] === 0x50 && bytes[1] === 0x4b) return "docx"; // zip
  return "txt";
}

export async function importarCurriculo(usuarioId, arquivo) {
  if (!arquivo || typeof arquivo.arrayBuffer !== "function") throw new ErroApp("Envie um arquivo PDF, DOCX ou TXT.");
  if (arquivo.size > TAMANHO_MAXIMO) throw new ErroApp("Arquivo maior que 3 MB.", 413);
  if (await excedeuLimite(`importar:${usuarioId}`, 15, 60)) throw muitasTentativas();

  const bytes = new Uint8Array(await arquivo.arrayBuffer());
  const tipo = tipoDe(bytes);
  let texto;
  try {
    if (tipo === "pdf") texto = await textoDoPdf(bytes);
    else if (tipo === "docx") texto = await textoDoDocx(bytes);
    else texto = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
  } catch (e) {
    console.error("importar:", e?.message);
    throw new ErroApp("Não consegui ler esse arquivo. Tente outro formato (PDF com texto, DOCX ou TXT).");
  }
  texto = texto.replace(/\u0000/g, "").slice(0, 60_000);
  if (texto.replace(/\s/g, "").length < 40)
    throw new ErroApp("Não encontrei texto no arquivo. Se for um PDF escaneado (imagem), exporte de novo como texto.");
  return lerCurriculo(texto);
}
