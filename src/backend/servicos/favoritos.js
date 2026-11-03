import "server-only";
import * as favoritos from "@/backend/repositorios/favoritos";
import { ErroApp } from "@/backend/http/erros";

const LIMITE = 200; // por usuário, para o banco não crescer sem controle

export const listarFavoritos = (usuarioId) => favoritos.listar(usuarioId);

export async function favoritar(usuarioId, { vaga }) {
  if (!vaga?.id || !vaga.titulo || !vaga.url) throw new ErroApp("Vaga inválida.");
  if ((await favoritos.contar(usuarioId)) >= LIMITE) throw new ErroApp(`Você já tem ${LIMITE} vagas favoritas. Remova algumas para adicionar novas.`);
  // Guarda só os campos usados na tela (sem nada vindo de fora que não seja da vaga).
  const { id, titulo, empresa, local, descricao, url, publicadaEm, salario, salarioMin, salarioMax, tags, modalidade, nivel, area, idioma, internacional, fonte } = vaga;
  await favoritos.adicionar(usuarioId, { id, titulo, empresa, local, descricao, url, publicadaEm, salario, salarioMin, salarioMax, tags, modalidade, nivel, area, idioma, internacional, fonte });
}

export async function desfavoritar(usuarioId, vagaId) {
  if (!vagaId) throw new ErroApp("Informe a vaga.");
  await favoritos.remover(usuarioId, vagaId);
}
