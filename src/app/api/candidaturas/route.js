import { desmarcarEnviada, listarCandidaturas, marcarEnviada } from "@/backend/servicos/candidaturas";
import { exigirOrigem, exigirUsuario, json, lerJson, rota } from "@/backend/http/requisicao";

export const GET = rota(async () => {
  const u = await exigirUsuario();
  return json({ candidaturas: await listarCandidaturas(u.id) });
});

export const POST = rota(async (req) => {
  const u = await exigirUsuario();
  await marcarEnviada(u.id, await lerJson(req));
  return json({ ok: true });
});

export const DELETE = rota(async (req) => {
  const u = await exigirUsuario();
  await exigirOrigem(req);
  await desmarcarEnviada(u.id, new URL(req.url).searchParams.get("vaga"));
  return json({ ok: true });
});
