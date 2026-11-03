import "server-only";
import { sql } from "@/backend/db/cliente";

// Um pedido novo substitui os anteriores do mesmo usuário. Validade: 1 hora.
export async function substituir({ tokenHash, usuarioId }) {
  await sql`DELETE FROM recuperacoes_senha WHERE usuario_id = ${usuarioId}`;
  await sql`
    INSERT INTO recuperacoes_senha (token_hash, usuario_id, expira_em)
    VALUES (${tokenHash}, ${usuarioId}, now() + interval '1 hour')`;
}

// Marca o token como usado na mesma operação que o valida: não pode ser reaproveitado.
// Devolve o id do usuário, ou null se o link expirou ou já foi usado.
export async function consumir(tokenHash) {
  const [pedido] = await sql`
    UPDATE recuperacoes_senha SET usado_em = now()
    WHERE token_hash = ${tokenHash} AND usado_em IS NULL AND expira_em > now()
    RETURNING usuario_id AS "usuarioId"`;
  return pedido?.usuarioId || null;
}

export async function descartarPendentes(usuarioId) {
  await sql`DELETE FROM recuperacoes_senha WHERE usuario_id = ${usuarioId} AND usado_em IS NULL`;
}
