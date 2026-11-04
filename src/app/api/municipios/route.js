import { cidadesDaUf } from "@/backend/geo/municipios";
import { rota } from "@/backend/http/requisicao";

// Lista fixa de cidades de um estado (para os seletores de local). Pública e cacheável: não muda.
export const GET = rota(async (req) => {
  const uf = new URL(req.url).searchParams.get("uf") || "";
  return Response.json({ cidades: cidadesDaUf(uf) }, { headers: { "Cache-Control": "public, max-age=86400, immutable" } });
});
