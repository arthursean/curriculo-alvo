import { sql } from "@/lib/db";
import { erro, lerJson, rota } from "@/lib/requisicao";
import { naoAutenticado, origemValida, usuarioAtual } from "@/lib/sessao";

export const GET = rota(async () => {
  const u = await usuarioAtual();
  if (!u) return naoAutenticado();
  const curriculos = await sql`
    SELECT vaga, ajuste, criado_em AS "criadoEm" FROM curriculos
    WHERE usuario_id = ${u.id} ORDER BY criado_em DESC`;
  return Response.json({ curriculos }, { headers: { "Cache-Control": "no-store" } });
});

export const POST = rota(async (req) => {
  const u = await usuarioAtual();
  if (!u) return naoAutenticado();
  const { corpo, falha } = await lerJson(req);
  if (falha) return falha;
  const { vaga, ajuste } = corpo;
  if (!vaga?.id || !ajuste) return erro("Dados incompletos.");
  await sql`
    INSERT INTO curriculos (usuario_id, vaga_id, vaga, ajuste) VALUES (${u.id}, ${String(vaga.id)}, ${JSON.stringify(vaga)}, ${JSON.stringify(ajuste)})
    ON CONFLICT (usuario_id, vaga_id) DO UPDATE SET vaga = EXCLUDED.vaga, ajuste = EXCLUDED.ajuste, criado_em = now()`;
  return Response.json({ ok: true });
});

export const DELETE = rota(async (req) => {
  const u = await usuarioAtual();
  if (!u) return naoAutenticado();
  if (!(await origemValida(req))) return erro("Origem não permitida.", 403);
  const vagaId = new URL(req.url).searchParams.get("vaga");
  await sql`DELETE FROM curriculos WHERE usuario_id = ${u.id} AND vaga_id = ${vagaId}`;
  return Response.json({ ok: true });
});
