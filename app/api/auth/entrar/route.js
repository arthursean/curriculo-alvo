import { sql } from "@/lib/db";
import { excedeuLimite, limparTentativas, muitasTentativas } from "@/lib/limite";
import { erro, lerJson, rota } from "@/lib/requisicao";
import { conferirSenha, conferirSenhaFalsa, normalizarEmail } from "@/lib/seguranca";
import { criarSessao, ipCliente } from "@/lib/sessao";

export const POST = rota(async (req) => {
  const { corpo, falha } = await lerJson(req);
  if (falha) return falha;

  const email = normalizarEmail(corpo.email);
  const senha = String(corpo.senha || "");
  if (!email || !senha) return erro("Informe e-mail e senha.");

  const chaveEmail = `login:${email}`;
  const chaveIp = `login-ip:${await ipCliente()}`;
  if ((await excedeuLimite(chaveEmail, 8, 15)) || (await excedeuLimite(chaveIp, 30, 15))) return muitasTentativas();

  const [u] = await sql`SELECT id, senha_hash FROM usuarios WHERE email = ${email}`;
  const ok = u ? await conferirSenha(senha, u.senha_hash) : await conferirSenhaFalsa(senha);
  // Mesma mensagem para e-mail inexistente e senha errada: não revela quem tem conta.
  if (!ok) return erro("E-mail ou senha incorretos.", 401);

  await limparTentativas(chaveEmail);
  await criarSessao(u.id);
  return Response.json({ ok: true });
});
