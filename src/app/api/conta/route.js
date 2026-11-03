import { excluirConta, trocarSenha } from "@/backend/servicos/conta";
import { encerrarSessao } from "@/backend/auth/sessao";
import { exigirUsuario, json, lerJson, rota } from "@/backend/http/requisicao";

export const PUT = rota(async (req) => {
  const u = await exigirUsuario();
  await trocarSenha(u.id, await lerJson(req));
  return json({ ok: true });
});

export const DELETE = rota(async (req) => {
  const u = await exigirUsuario();
  await excluirConta(u.id, await lerJson(req));
  await encerrarSessao();
  return json({ ok: true });
});
