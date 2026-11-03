import "server-only";
import * as usuarios from "@/backend/repositorios/usuarios";
import { conferirSenha, gerarHashSenha, validarSenha } from "@/backend/auth/seguranca";
import { ErroApp } from "@/backend/http/erros";

async function exigirSenhaCorreta(usuarioId, senha, mensagem) {
  const hash = await usuarios.senhaHash(usuarioId);
  if (!(await conferirSenha(String(senha || ""), hash))) throw new ErroApp(mensagem, 401);
}

// Trocar a senha estando logado (exige a senha atual).
export async function trocarSenha(usuarioId, { senhaAtual, novaSenha }) {
  await exigirSenhaCorreta(usuarioId, senhaAtual, "Senha atual incorreta.");
  const problema = validarSenha(novaSenha);
  if (problema) throw new ErroApp(problema);
  await usuarios.atualizarSenha(usuarioId, await gerarHashSenha(novaSenha));
}

// Exclui a conta e todos os dados (perfil, currículos, sessões) — direito previsto na LGPD.
export async function excluirConta(usuarioId, { senha }) {
  await exigirSenhaCorreta(usuarioId, senha, "Senha incorreta.");
  await usuarios.excluir(usuarioId);
}
