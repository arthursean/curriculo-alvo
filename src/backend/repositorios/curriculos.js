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

// Para o painel: quantos, compatibilidade média e os mais recentes.
export async function resumo(usuarioId) {
  const [totais] = await sql`
    SELECT count(*)::int AS total,
           (count(*) FILTER (WHERE criado_em > now() - interval '30 days'))::int AS "ultimos30",
           round(avg((ajuste->>'compatibilidade')::numeric))::int AS "compatMedia",
           (count(*) FILTER (WHERE ajuste->'traducao' IS NOT NULL AND ajuste->'traducao' <> 'null'::jsonb))::int AS traduzidos
    FROM curriculos WHERE usuario_id = ${usuarioId}`;
  const recentes = await sql`
    SELECT vaga->>'id' AS "vagaId", vaga->>'titulo' AS titulo, vaga->>'empresa' AS empresa,
           (ajuste->>'compatibilidade')::int AS compat, criado_em AS "em"
    FROM curriculos WHERE usuario_id = ${usuarioId} ORDER BY criado_em DESC LIMIT 5`;
  return { ...totais, recentes };
}
