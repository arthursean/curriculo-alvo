import "server-only";
import * as usuarios from "@/backend/repositorios/usuarios";
import * as sessoes from "@/backend/repositorios/sessoes";
import * as recuperacoes from "@/backend/repositorios/recuperacoes";
import { excedeuLimite, limparTentativas } from "@/backend/auth/limite";
import { conferirSenha, conferirSenhaFalsa, gerarHashSenha, gerarToken, hashToken, normalizarEmail, validarSenha } from "@/backend/auth/seguranca";
import { enviarEmailRecuperacao } from "@/backend/email/email";
import { ErroApp, muitasTentativas } from "@/backend/http/erros";

export const MENSAGEM_RECUPERACAO = "Se existir uma conta com este e-mail, enviamos um link para redefinir a senha.";

// Devolve o id do novo usuário.
export async function cadastrar({ nome, email, senha }, ip) {
  if (await excedeuLimite(`cadastro:${ip}`, 5, 60)) throw muitasTentativas();
  nome = String(nome || "").trim().slice(0, 120);
  email = normalizarEmail(email);
  if (!nome) throw new ErroApp("Informe seu nome.");
  if (!email) throw new ErroApp("E-mail inválido.");
  const problema = validarSenha(senha);
  if (problema) throw new ErroApp(problema);

  const id = await usuarios.criar({ email, nome, senhaHash: await gerarHashSenha(senha) });
  if (!id) throw new ErroApp("Já existe uma conta com este e-mail. Entre ou recupere a senha.", 409);
  return id;
}

// Devolve o id do usuário se e-mail e senha conferem.
export async function entrar({ email, senha }, ip) {
  email = normalizarEmail(email);
  senha = String(senha || "");
  if (!email || !senha) throw new ErroApp("Informe e-mail e senha.");

  const chaveEmail = `login:${email}`;
  if ((await excedeuLimite(chaveEmail, 8, 15)) || (await excedeuLimite(`login-ip:${ip}`, 30, 15))) throw muitasTentativas();

  const u = await usuarios.porEmail(email);
  const ok = u ? await conferirSenha(senha, u.senhaHash) : await conferirSenhaFalsa(senha);
  // Mesma mensagem para e-mail inexistente e senha errada: não revela quem tem conta.
  if (!ok) throw new ErroApp("E-mail ou senha incorretos.", 401);

  await limparTentativas(chaveEmail);
  return u.id;
}

// Sempre responde igual, exista ou não a conta.
export async function solicitarRecuperacao({ email }, ip) {
  email = normalizarEmail(email);
  if (!email) throw new ErroApp("E-mail inválido.");
  if (await excedeuLimite(`esqueci-ip:${ip}`, 10, 60)) throw muitasTentativas();
  if (await excedeuLimite(`esqueci:${email}`, 3, 60)) return;

  const u = await usuarios.porEmail(email);
  if (!u) return;
  const token = gerarToken();
  await recuperacoes.substituir({ tokenHash: hashToken(token), usuarioId: u.id });
  try {
    await enviarEmailRecuperacao({ para: email, nome: u.nome, token });
  } catch (e) {
    console.error("Falha ao enviar e-mail de recuperação:", e);
  }
}

// Troca a senha pelo link do e-mail e desconecta todos os aparelhos. Devolve o id do usuário.
export async function redefinirSenha({ token, senha }, ip) {
  if (await excedeuLimite(`redefinir-ip:${ip}`, 20, 60)) throw muitasTentativas();
  if (!token) throw new ErroApp("Link inválido.");
  const problema = validarSenha(senha);
  if (problema) throw new ErroApp(problema);

  const usuarioId = await recuperacoes.consumir(hashToken(String(token)));
  if (!usuarioId) throw new ErroApp("Este link expirou ou já foi usado. Peça um novo.", 410);

  await usuarios.atualizarSenha(usuarioId, await gerarHashSenha(senha));
  await sessoes.excluirTodasDoUsuario(usuarioId);
  await recuperacoes.descartarPendentes(usuarioId);
  return usuarioId;
}
