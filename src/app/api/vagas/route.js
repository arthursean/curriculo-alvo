import { after } from "next/server";
import { buscarVagas } from "@/backend/servicos/vagas";
import { registrarBusca } from "@/backend/servicos/painel";
import { exigirUsuario, json, rota } from "@/backend/http/requisicao";

// Só usuários logados buscam, para proteger a cota das APIs de vagas.
export const GET = rota(async (req) => {
  const u = await exigirUsuario();
  const p = new URL(req.url).searchParams;
  const filtros = {
    q: p.get("q"),
    uf: (p.get("uf") || "").trim(),
    cidade: (p.get("cidade") || "").trim(),
    raio: Number(p.get("raio")) || 0,
    dias: Number(p.get("dias")) || 0,
    modalidades: p.getAll("modalidade"),
    niveis: p.getAll("nivel"),
    areas: p.getAll("area"),
  };
  const r = await buscarVagas(filtros);
  // Registra a busca para o painel depois de responder (não atrasa a lista de vagas).
  after(() => registrarBusca(u.id, {
    termos: filtros.q ? [filtros.q.trim()] : r.termos, uf: filtros.uf, cidade: filtros.cidade, raio: filtros.raio, total: r.vagas.length,
  }));
  return json(r);
});
