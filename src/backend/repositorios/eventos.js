import "server-only";
import { sql } from "@/backend/db/cliente";

// Hoje só um tipo é registrado: "link" (clique em "Ver vaga original"), para a lista de vagas
// visitadas do painel, de onde dá para marcar a candidatura como enviada.

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

// Últimas vagas cujo link original você abriu (uma linha por vaga).
export async function ultimosLinks(usuarioId, limite = 6) {
  return sql`
    SELECT vaga_id AS "vagaId", dados, criado_em AS "em" FROM (
      SELECT DISTINCT ON (vaga_id) vaga_id, dados, criado_em
      FROM eventos WHERE usuario_id = ${usuarioId} AND tipo = 'link'
      ORDER BY vaga_id, criado_em DESC
    ) x ORDER BY criado_em DESC LIMIT ${limite}`;
}
