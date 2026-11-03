import { encerrarSessao } from "@/backend/auth/sessao";
import { exigirOrigem, json, rota } from "@/backend/http/requisicao";

export const POST = rota(async (req) => {
  await exigirOrigem(req);
  await encerrarSessao();
  return json({ ok: true });
});
