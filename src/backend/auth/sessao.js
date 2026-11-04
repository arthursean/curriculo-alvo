import "server-only";
import { cookies } from "next/headers";
import * as sessoes from "@/backend/repositorios/sessoes";
import { gerarToken, hashToken } from "./seguranca";
import { COOKIE_SESSAO } from "@/shared/sessao";

const COOKIE = COOKIE_SESSAO;
const DURACAO_DIAS = 30;

// Cria a sessão no banco e grava o cookie (HttpOnly: o JavaScript da página não consegue ler).
export async function criarSessao(usuarioId) {
  const token = gerarToken();
  const expiraEm = new Date(Date.now() + DURACAO_DIAS * 86400000);
  await sessoes.criar({ tokenHash: hashToken(token), usuarioId, expiraEm });
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiraEm,
  });
}

export async function usuarioAtual() {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  return sessoes.usuarioDaSessao(hashToken(token));
}

export async function encerrarSessao() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) await sessoes.excluir(hashToken(token));
  jar.delete(COOKIE);
}
