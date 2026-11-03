import "server-only";
import { sql } from "@/backend/db/cliente";

export async function obter(usuarioId) {
  const [p] = await sql`SELECT dados FROM perfis WHERE usuario_id = ${usuarioId}`;
  return p?.dados || null;
}

export async function salvar(usuarioId, dados) {
  await sql`
    INSERT INTO perfis (usuario_id, dados, atualizado_em) VALUES (${usuarioId}, ${JSON.stringify(dados)}, now())
    ON CONFLICT (usuario_id) DO UPDATE SET dados = EXCLUDED.dados, atualizado_em = now()`;
}
