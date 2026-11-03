import "server-only";
import * as perfis from "@/backend/repositorios/perfis";
import * as curriculos from "@/backend/repositorios/curriculos";
import { ErroApp } from "@/backend/http/erros";

export const obterPerfil = (usuarioId) => perfis.obter(usuarioId);

export async function salvarPerfil(usuarioId, perfil) {
  if (!perfil || typeof perfil !== "object" || Array.isArray(perfil)) throw new ErroApp("Perfil inválido.");
  await perfis.salvar(usuarioId, perfil);
}

export const listarCurriculos = (usuarioId) => curriculos.listar(usuarioId);

export async function salvarCurriculo(usuarioId, { vaga, ajuste }) {
  if (!vaga?.id || !ajuste) throw new ErroApp("Dados incompletos.");
  await curriculos.salvar(usuarioId, vaga, ajuste);
}

export async function removerCurriculo(usuarioId, vagaId) {
  if (!vagaId) throw new ErroApp("Informe a vaga.");
  await curriculos.remover(usuarioId, vagaId);
}
