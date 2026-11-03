import { rota } from "@/lib/requisicao";
import { encerrarSessao, origemValida } from "@/lib/sessao";

export const POST = rota(async (req) => {
  if (!(await origemValida(req))) return Response.json({ erro: "Origem não permitida." }, { status: 403 });
  await encerrarSessao();
  return Response.json({ ok: true });
});
