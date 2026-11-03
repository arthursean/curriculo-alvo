import { buscarVagas } from "@/backend/servicos/vagas";
import { exigirUsuario, json, rota } from "@/backend/http/requisicao";

// Só usuários logados buscam, para proteger a cota das APIs de vagas.
export const GET = rota(async (req) => {
  await exigirUsuario();
  const p = new URL(req.url).searchParams;
  return json(await buscarVagas({
    q: p.get("q"),
    local: (p.get("local") || "").trim(),
    dias: Number(p.get("dias")) || 0,
    modalidades: p.getAll("modalidade"),
    niveis: p.getAll("nivel"),
    areas: p.getAll("area"),
  }));
});
