import "server-only";
import { cookies, headers } from "next/headers";
import { sql } from "./db";
import { gerarToken, hashToken } from "./seguranca";

const COOKIE = "ca_sessao";
const DURACAO_DIAS = 30;

export async function criarSessao(usuarioId) {
  const token = gerarToken();
  const expira = new Date(Date.now() + DURACAO_DIAS * 86400000);
  await sql`INSERT INTO sessoes (token_hash, usuario_id, expira_em) VALUES (${hashToken(token)}, ${usuarioId}, ${expira})`;
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expira,
  });
}

export async function usuarioAtual() {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const [u] = await sql`
    SELECT u.id, u.email, u.nome FROM sessoes s JOIN usuarios u ON u.id = s.usuario_id
    WHERE s.token_hash = ${hashToken(token)} AND s.expira_em > now()`;
  return u || null;
}

export async function encerrarSessao() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) await sql`DELETE FROM sessoes WHERE token_hash = ${hashToken(token)}`;
  jar.delete(COOKIE);
}

export const naoAutenticado = () => Response.json({ erro: "Entre na sua conta para continuar." }, { status: 401 });

// Bloqueia POSTs vindos de outros sites (CSRF) além da proteção do cookie SameSite.
export async function origemValida(req) {
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
