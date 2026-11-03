import "server-only";
import { headers } from "next/headers";
import { ErroApp, naoAutenticado } from "./erros";
import { usuarioAtual } from "@/backend/auth/sessao";

const LIMITE_BYTES = 200_000;

// Bloqueia POSTs vindos de outros sites (CSRF) além da proteção do cookie SameSite.
async function origemValida(req) {
  const origem = req.headers.get("origin");
  if (!origem) return true;
  const host = (await headers()).get("host");
  try {
    return new URL(origem).host === host;
  } catch {
    return false;
  }
}

export async function ipCliente() {
  const h = await headers();
  return (h.get("x-forwarded-for") || "").split(",")[0].trim() || h.get("x-real-ip") || "local";
}

// Lê o corpo JSON com limite de tamanho e checagem de origem.
export async function lerJson(req) {
  if (!(await origemValida(req))) throw new ErroApp("Origem não permitida.", 403);
  const texto = await req.text();
  if (texto.length > LIMITE_BYTES) throw new ErroApp("Dados grandes demais.", 413);
  try {
    return JSON.parse(texto || "{}");
  } catch {
    throw new ErroApp("JSON inválido.");
  }
}

// Para rotas que mudam dados sem corpo (DELETE, sair): só confere a origem.
export async function exigirOrigem(req) {
  if (!(await origemValida(req))) throw new ErroApp("Origem não permitida.", 403);
}

export async function exigirUsuario() {
  const u = await usuarioAtual();
  if (!u) throw naoAutenticado();
  return u;
}

export const json = (dados, status = 200) =>
  Response.json(dados, { status, headers: { "Cache-Control": "no-store" } });

// Envolve o controlador: ErroApp vira resposta com a mensagem; qualquer outro erro vira 500
// genérico (o detalhe vai só para o log do servidor).
export function rota(fn) {
  return async (req, ctx) => {
    try {
      return await fn(req, ctx);
    } catch (e) {
      if (e instanceof ErroApp) return json({ erro: e.message }, e.status);
      console.error(e);
      return json({ erro: "Erro interno. Tente novamente." }, 500);
    }
  };
}
