import { listarCurriculos, removerCurriculo, salvarCurriculo } from "@/backend/servicos/perfil";
import { exigirOrigem, exigirUsuario, json, lerJson, rota } from "@/backend/http/requisicao";

export const GET = rota(async () => {
  const u = await exigirUsuario();
  return json({ curriculos: await listarCurriculos(u.id) });
});

export const POST = rota(async (req) => {
  const u = await exigirUsuario();
  await salvarCurriculo(u.id, await lerJson(req));
  return json({ ok: true });
});

export const DELETE = rota(async (req) => {
  const u = await exigirUsuario();
  await exigirOrigem(req);
  await removerCurriculo(u.id, new URL(req.url).searchParams.get("vaga"));
  return json({ ok: true });
});
