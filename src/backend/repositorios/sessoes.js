import "server-only";
import { sql } from "@/backend/db/cliente";

// Só o hash do token é guardado; o token em si fica apenas no cookie do usuário.
export async function criar({ tokenHash, usuarioId, expiraEm }) {
  await sql`INSERT INTO sessoes (token_hash, usuario_id, expira_em) VALUES (${tokenHash}, ${usuarioId}, ${expiraEm})`;
}

export async function usuarioDaSessao(tokenHash) {
  const [u] = await sql`
    SELECT u.id, u.email, u.nome FROM sessoes s JOIN usuarios u ON u.id = s.usuario_id
    WHERE s.token_hash = ${tokenHash} AND s.expira_em > now()`;
  return u || null;
}

export async function excluir(tokenHash) {
  await sql`DELETE FROM sessoes WHERE token_hash = ${tokenHash}`;
}

export async function excluirTodasDoUsuario(usuarioId) {
  await sql`DELETE FROM sessoes WHERE usuario_id = ${usuarioId}`;
}
