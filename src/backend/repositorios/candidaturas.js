import "server-only";
import { sql } from "@/backend/db/cliente";

export async function listar(usuarioId) {
  return sql`
    SELECT vaga, compatibilidade, enviada_em AS "enviadaEm" FROM candidaturas
    WHERE usuario_id = ${usuarioId} ORDER BY enviada_em DESC`;
}

export async function contar(usuarioId) {
  const [{ total }] = await sql`SELECT count(*)::int AS total FROM candidaturas WHERE usuario_id = ${usuarioId}`;
  return total;
}

export async function marcar(usuarioId, vaga, compatibilidade) {
  await sql`
    INSERT INTO candidaturas (usuario_id, vaga_id, vaga, compatibilidade)
    VALUES (${usuarioId}, ${String(vaga.id)}, ${JSON.stringify(vaga)}, ${compatibilidade ?? null})
    ON CONFLICT (usuario_id, vaga_id) DO UPDATE
      SET compatibilidade = COALESCE(EXCLUDED.compatibilidade, candidaturas.compatibilidade)`;
}

export async function desmarcar(usuarioId, vagaId) {
  await sql`DELETE FROM candidaturas WHERE usuario_id = ${usuarioId} AND vaga_id = ${vagaId}`;
}

// Para o painel: totais, compatibilidade média das enviadas e as mais recentes.
export async function resumo(usuarioId) {
  const [totais] = await sql`
    SELECT count(*)::int AS total,
           (count(*) FILTER (WHERE enviada_em > now() - interval '30 days'))::int AS "ultimos30",
           round(avg(compatibilidade))::int AS "compatMedia"
    FROM candidaturas WHERE usuario_id = ${usuarioId}`;
  const recentes = await sql`
    SELECT vaga->>'id' AS "vagaId", vaga->>'titulo' AS titulo, vaga->>'empresa' AS empresa, vaga->>'url' AS url,
           compatibilidade AS compat, enviada_em AS "em"
    FROM candidaturas WHERE usuario_id = ${usuarioId} ORDER BY enviada_em DESC LIMIT 6`;
  return { ...totais, recentes };
}

// Compatibilidade média das vagas em que você gerou currículo OU se candidatou (cada vaga
// conta uma vez; se tem as duas, vale a da candidatura).
export async function compatibilidadeGeral(usuarioId) {
  const [r] = await sql`
    SELECT round(avg(c))::int AS media, count(*)::int AS vagas FROM (
      SELECT DISTINCT ON (vaga_id) vaga_id, c FROM (
        SELECT vaga_id, compatibilidade AS c, 1 AS ordem FROM candidaturas
        WHERE usuario_id = ${usuarioId} AND compatibilidade IS NOT NULL
        UNION ALL
        SELECT vaga_id, (ajuste->>'compatibilidade')::int, 2 FROM curriculos
        WHERE usuario_id = ${usuarioId} AND ajuste ? 'compatibilidade'
      ) x ORDER BY vaga_id, ordem
    ) y`;
  return r;
}
