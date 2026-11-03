import { sql } from "@/lib/db";
import { enviarEmailRecuperacao } from "@/lib/email";
import { excedeuLimite, muitasTentativas } from "@/lib/limite";
import { erro, lerJson, rota } from "@/lib/requisicao";
import { gerarToken, hashToken, normalizarEmail } from "@/lib/seguranca";
import { ipCliente } from "@/lib/sessao";

const RESPOSTA = { ok: true, mensagem: "Se existir uma conta com este e-mail, enviamos um link para redefinir a senha." };

export const POST = rota(async (req) => {
  const { corpo, falha } = await lerJson(req);
  if (falha) return falha;

  const email = normalizarEmail(corpo.email);
  if (!email) return erro("E-mail inválido.");
  if ((await excedeuLimite(`esqueci-ip:${await ipCliente()}`, 10, 60))) return muitasTentativas();
  // Limite por e-mail responde igual ao sucesso, para não revelar se a conta existe.
  if (await excedeuLimite(`esqueci:${email}`, 3, 60)) return Response.json(RESPOSTA);

  const [u] = await sql`SELECT id, nome FROM usuarios WHERE email = ${email}`;
  if (u) {
    const token = gerarToken();
    // Um pedido novo invalida os links anteriores.
    await sql`DELETE FROM recuperacoes_senha WHERE usuario_id = ${u.id}`;
    await sql`
      INSERT INTO recuperacoes_senha (token_hash, usuario_id, expira_em)
      VALUES (${hashToken(token)}, ${u.id}, now() + interval '1 hour')`;
    try {
      await enviarEmailRecuperacao({ para: email, nome: u.nome, token });
    } catch (e) {
      console.error("Falha ao enviar e-mail de recuperação:", e);
    }
  }
  return Response.json(RESPOSTA);
});
