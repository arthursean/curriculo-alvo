import { sql } from "@/lib/db";
import { erro, lerJson, rota } from "@/lib/requisicao";
import { naoAutenticado, usuarioAtual } from "@/lib/sessao";

export const GET = rota(async () => {
  const u = await usuarioAtual();
  if (!u) return naoAutenticado();
  const [p] = await sql`SELECT dados FROM perfis WHERE usuario_id = ${u.id}`;
  return Response.json({ perfil: p?.dados || null, usuario: u }, { headers: { "Cache-Control": "no-store" } });
});

export const PUT = rota(async (req) => {
  const u = await usuarioAtual();
  if (!u) return naoAutenticado();
  const { corpo, falha } = await lerJson(req);
  if (falha) return falha;
  if (!corpo.perfil || typeof corpo.perfil !== "object") return erro("Perfil inválido.");
  await sql`
    INSERT INTO perfis (usuario_id, dados, atualizado_em) VALUES (${u.id}, ${JSON.stringify(corpo.perfil)}, now())
    ON CONFLICT (usuario_id) DO UPDATE SET dados = EXCLUDED.dados, atualizado_em = now()`;
  return Response.json({ ok: true });
});
