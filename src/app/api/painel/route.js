import { painel } from "@/backend/servicos/painel";
import { exigirUsuario, json, rota } from "@/backend/http/requisicao";

export const GET = rota(async () => {
  const u = await exigirUsuario();
  return json({ painel: await painel(u.id), usuario: u });
});
