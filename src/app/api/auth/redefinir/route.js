import { redefinirSenha } from "@/backend/servicos/autenticacao";
import { criarSessao } from "@/backend/auth/sessao";
import { ipCliente, json, lerJson, rota } from "@/backend/http/requisicao";

export const POST = rota(async (req) => {
  const id = await redefinirSenha(await lerJson(req), await ipCliente());
  await criarSessao(id);
  return json({ ok: true });
});
