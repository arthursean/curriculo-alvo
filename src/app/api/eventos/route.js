import { registrarEvento } from "@/backend/servicos/painel";
import { exigirUsuario, json, lerJson, rota } from "@/backend/http/requisicao";

// Registra um clique da tela (vaga aberta, link original, PDF). Também recebe navigator.sendBeacon.
export const POST = rota(async (req) => {
  const u = await exigirUsuario();
  await registrarEvento(u.id, await lerJson(req));
  return json({ ok: true });
});
