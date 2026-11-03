import { desfavoritar, favoritar, listarFavoritos } from "@/backend/servicos/favoritos";
import { exigirOrigem, exigirUsuario, json, lerJson, rota } from "@/backend/http/requisicao";

export const GET = rota(async () => {
  const u = await exigirUsuario();
  return json({ favoritos: await listarFavoritos(u.id) });
});

export const POST = rota(async (req) => {
  const u = await exigirUsuario();
  await favoritar(u.id, await lerJson(req));
  return json({ ok: true });
});

export const DELETE = rota(async (req) => {
  const u = await exigirUsuario();
  await exigirOrigem(req);
  await desfavoritar(u.id, new URL(req.url).searchParams.get("vaga"));
  return json({ ok: true });
});
