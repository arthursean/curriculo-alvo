import { sql } from "@/lib/db";
import { excedeuLimite, muitasTentativas } from "@/lib/limite";
import { erro, lerJson, rota } from "@/lib/requisicao";
import { gerarHashSenha, hashToken, validarSenha } from "@/lib/seguranca";
import { criarSessao, ipCliente } from "@/lib/sessao";

export const POST = rota(async (req) => {
  const { corpo, falha } = await lerJson(req);
  if (falha) return falha;
  if (await excedeuLimite(`redefinir-ip:${await ipCliente()}`, 20, 60)) return muitasTentativas();

  const token = String(corpo.token || "");
  const problema = validarSenha(corpo.senha);
  if (!token) return erro("Link inválido.");
  if (problema) return erro(problema);

  // Marca o token como usado na mesma operação que o valida: não pode ser reaproveitado.
  const [pedido] = await sql`
    UPDATE recuperacoes_senha SET usado_em = now()
    WHERE token_hash = ${hashToken(token)} AND usado_em IS NULL AND expira_em > now()
    RETURNING usuario_id`;
  if (!pedido) return erro("Este link expirou ou já foi usado. Peça um novo.", 410);

  const hash = await gerarHashSenha(corpo.senha);
  await sql`UPDATE usuarios SET senha_hash = ${hash} WHERE id = ${pedido.usuario_id}`;
  // Desconecta todos os aparelhos e apaga outros links pendentes.
  await sql`DELETE FROM sessoes WHERE usuario_id = ${pedido.usuario_id}`;
  await sql`DELETE FROM recuperacoes_senha WHERE usuario_id = ${pedido.usuario_id} AND usado_em IS NULL`;

  await criarSessao(pedido.usuario_id);
  return Response.json({ ok: true });
});
