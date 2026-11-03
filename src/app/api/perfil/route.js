import { obterPerfil, salvarPerfil } from "@/backend/servicos/perfil";
import { exigirUsuario, json, lerJson, rota } from "@/backend/http/requisicao";

export const GET = rota(async () => {
  const u = await exigirUsuario();
  return json({ perfil: await obterPerfil(u.id), usuario: u });
});

export const PUT = rota(async (req) => {
  const u = await exigirUsuario();
  await salvarPerfil(u.id, (await lerJson(req)).perfil);
  return json({ ok: true });
});
