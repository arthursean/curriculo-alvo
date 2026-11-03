import { sql } from "@/lib/db";
import { erro, lerJson, rota } from "@/lib/requisicao";
import { conferirSenha, gerarHashSenha, validarSenha } from "@/lib/seguranca";
import { encerrarSessao, naoAutenticado, usuarioAtual } from "@/lib/sessao";

// Trocar a senha estando logado (exige a senha atual).
export const PUT = rota(async (req) => {
  const u = await usuarioAtual();
  if (!u) return naoAutenticado();
  const { corpo, falha } = await lerJson(req);
  if (falha) return falha;
  const [{ senha_hash }] = await sql`SELECT senha_hash FROM usuarios WHERE id = ${u.id}`;
  if (!(await conferirSenha(String(corpo.senhaAtual || ""), senha_hash))) return erro("Senha atual incorreta.", 401);
  const problema = validarSenha(corpo.novaSenha);
  if (problema) return erro(problema);
  await sql`UPDATE usuarios SET senha_hash = ${await gerarHashSenha(corpo.novaSenha)} WHERE id = ${u.id}`;
  return Response.json({ ok: true });
});

// Excluir a conta e todos os dados (perfil, currículos, sessões) — direito previsto na LGPD.
export const DELETE = rota(async (req) => {
  const u = await usuarioAtual();
  if (!u) return naoAutenticado();
  const { corpo, falha } = await lerJson(req);
  if (falha) return falha;
  const [{ senha_hash }] = await sql`SELECT senha_hash FROM usuarios WHERE id = ${u.id}`;
  if (!(await conferirSenha(String(corpo.senha || ""), senha_hash))) return erro("Senha incorreta.", 401);
  await sql`DELETE FROM usuarios WHERE id = ${u.id}`;
  await encerrarSessao();
  return Response.json({ ok: true });
});
