import "server-only";
import { sql } from "@/backend/db/cliente";

// Datas agrupadas pelo dia no horário de Brasília.
const FUSO = "America/Sao_Paulo";

export async function registrar(usuarioId, tipo, vagaId, dados) {
  await sql`
    INSERT INTO eventos (usuario_id, tipo, vaga_id, dados)
    VALUES (${usuarioId}, ${tipo}, ${vagaId || null}, ${dados ? JSON.stringify(dados) : null})`;
}

export async function contarUltimaHora(usuarioId) {
  const [{ n }] = await sql`
    SELECT count(*)::int AS n FROM eventos WHERE usuario_id = ${usuarioId} AND criado_em > now() - interval '1 hour'`;
  return n;
}

export async function apagarAntigos(usuarioId) {
  await sql`DELETE FROM eventos WHERE usuario_id = ${usuarioId} AND criado_em < now() - interval '365 days'`;
}

// Por tipo: total, últimos 30 dias e quantas vagas diferentes.
export async function totaisPorTipo(usuarioId) {
  return sql`
    SELECT tipo,
           count(*)::int AS total,
           (count(*) FILTER (WHERE criado_em > now() - interval '30 days'))::int AS "ultimos30",
           count(DISTINCT vaga_id)::int AS vagas,
           (count(DISTINCT vaga_id) FILTER (WHERE criado_em > now() - interval '30 days'))::int AS "vagas30"
    FROM eventos WHERE usuario_id = ${usuarioId}
    GROUP BY tipo`;
}

// Vagas diferentes abertas (detalhes ou link) por dia, nos últimos `dias` dias.
export async function vagasPorDia(usuarioId, dias = 30) {
  return sql`
    SELECT to_char((criado_em AT TIME ZONE ${FUSO})::date, 'YYYY-MM-DD') AS dia,
           count(DISTINCT vaga_id)::int AS vagas
    FROM eventos
    WHERE usuario_id = ${usuarioId} AND tipo IN ('detalhes', 'link')
      AND criado_em > now() - make_interval(days => ${dias})
    GROUP BY 1 ORDER BY 1`;
}

// Áreas das vagas que você abriu nos últimos 90 dias.
export async function areasAbertas(usuarioId) {
  return sql`
    SELECT dados->>'area' AS area, count(DISTINCT vaga_id)::int AS vagas
    FROM eventos
    WHERE usuario_id = ${usuarioId} AND tipo IN ('detalhes', 'link') AND dados->>'area' IS NOT NULL
      AND criado_em > now() - interval '90 days'
    GROUP BY 1 ORDER BY 2 DESC LIMIT 6`;
}

// Termos mais buscados nos últimos 90 dias.
export async function termosBuscados(usuarioId) {
  return sql`
    SELECT lower(t) AS termo, count(*)::int AS vezes
    FROM eventos, jsonb_array_elements_text(dados->'termos') AS t
    WHERE usuario_id = ${usuarioId} AND tipo = 'busca' AND criado_em > now() - interval '90 days'
    GROUP BY 1 ORDER BY 2 DESC LIMIT 6`;
}

// Últimas vagas cujo link original você abriu (uma linha por vaga).
export async function ultimosLinks(usuarioId, limite = 6) {
  return sql`
    SELECT vaga_id AS "vagaId", dados, criado_em AS "em" FROM (
      SELECT DISTINCT ON (vaga_id) vaga_id, dados, criado_em
      FROM eventos WHERE usuario_id = ${usuarioId} AND tipo = 'link'
      ORDER BY vaga_id, criado_em DESC
    ) x ORDER BY criado_em DESC LIMIT ${limite}`;
}
