import "server-only";
import { sql } from "@/backend/db/cliente";

export async function listar(usuarioId) {
  return sql`
    SELECT vaga, criado_em AS "criadoEm" FROM favoritos
    WHERE usuario_id = ${usuarioId} ORDER BY criado_em DESC`;
}

export async function contar(usuarioId) {
  const [{ total }] = await sql`SELECT count(*)::int AS total FROM favoritos WHERE usuario_id = ${usuarioId}`;
  return total;
}

export async function adicionar(usuarioId, vaga) {
  await sql`
    INSERT INTO favoritos (usuario_id, vaga_id, vaga) VALUES (${usuarioId}, ${String(vaga.id)}, ${JSON.stringify(vaga)})
    ON CONFLICT (usuario_id, vaga_id) DO NOTHING`;
}

export async function remover(usuarioId, vagaId) {
  await sql`DELETE FROM favoritos WHERE usuario_id = ${usuarioId} AND vaga_id = ${vagaId}`;
}
