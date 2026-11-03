import "server-only";
import { sql } from "@/backend/db/cliente";

export async function listar(usuarioId) {
  return sql`
    SELECT vaga, ajuste, criado_em AS "criadoEm" FROM curriculos
    WHERE usuario_id = ${usuarioId} ORDER BY criado_em DESC`;
}

export async function salvar(usuarioId, vaga, ajuste) {
  await sql`
    INSERT INTO curriculos (usuario_id, vaga_id, vaga, ajuste)
    VALUES (${usuarioId}, ${String(vaga.id)}, ${JSON.stringify(vaga)}, ${JSON.stringify(ajuste)})
    ON CONFLICT (usuario_id, vaga_id) DO UPDATE SET vaga = EXCLUDED.vaga, ajuste = EXCLUDED.ajuste, criado_em = now()`;
}

export async function remover(usuarioId, vagaId) {
  await sql`DELETE FROM curriculos WHERE usuario_id = ${usuarioId} AND vaga_id = ${vagaId}`;
}
