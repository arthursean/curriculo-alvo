import { rota } from "@/lib/requisicao";
import { usuarioAtual } from "@/lib/sessao";

export const GET = rota(async () => {
  const usuario = await usuarioAtual();
  return Response.json({ usuario }, { headers: { "Cache-Control": "no-store" } });
});
