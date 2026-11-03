import { MENSAGEM_RECUPERACAO, solicitarRecuperacao } from "@/backend/servicos/autenticacao";
import { ipCliente, json, lerJson, rota } from "@/backend/http/requisicao";

export const POST = rota(async (req) => {
  await solicitarRecuperacao(await lerJson(req), await ipCliente());
  return json({ ok: true, mensagem: MENSAGEM_RECUPERACAO });
});
