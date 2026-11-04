import "server-only";
import * as candidaturas from "@/backend/repositorios/candidaturas";
import { ErroApp } from "@/backend/http/erros";

const LIMITE = 1000; // por usuário
const texto = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const urlSegura = (u) => (typeof u === "string" && /^https?:\/\/[^\s"'<>]+$/i.test(u) && u.length <= 1000 ? u : "");

export const listarCandidaturas = (usuarioId) => candidaturas.listar(usuarioId);

// Guarda só o resumo da vaga usado nas telas.
export async function marcarEnviada(usuarioId, { vaga, compatibilidade } = {}) {
  const id = texto(vaga?.id, 200);
  if (!id || !texto(vaga?.titulo, 1)) throw new ErroApp("Vaga inválida.");
  if ((await candidaturas.contar(usuarioId)) >= LIMITE) throw new ErroApp("Limite de candidaturas registradas atingido.");
  const c = Number(compatibilidade);
  await candidaturas.marcar(
    usuarioId,
    { id, titulo: texto(vaga.titulo, 200), empresa: texto(vaga.empresa, 120), local: texto(vaga.local, 120), url: urlSegura(vaga.url), fonte: texto(vaga.fonte, 40) },
    Number.isFinite(c) ? Math.max(0, Math.min(100, Math.round(c))) : null,
  );
}

export async function desmarcarEnviada(usuarioId, vagaId) {
  if (!vagaId) throw new ErroApp("Informe a vaga.");
  await candidaturas.desmarcar(usuarioId, vagaId);
}
