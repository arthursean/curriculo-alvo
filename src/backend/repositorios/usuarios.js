import "server-only";
import { sql } from "@/backend/db/cliente";

// Devolve o novo id, ou null se o e-mail já existir.
export async function criar({ email, nome, senhaHash }) {
  const [novo] = await sql`
    INSERT INTO usuarios (email, nome, senha_hash) VALUES (${email}, ${nome}, ${senhaHash})
    ON CONFLICT (email) DO NOTHING RETURNING id`;
  return novo?.id || null;
}

export async function porEmail(email) {
  const [u] = await sql`SELECT id, nome, senha_hash AS "senhaHash" FROM usuarios WHERE email = ${email}`;
  return u || null;
}

export async function senhaHash(id) {
  const [u] = await sql`SELECT senha_hash AS "senhaHash" FROM usuarios WHERE id = ${id}`;
  return u?.senhaHash || null;
}

export async function atualizarSenha(id, novoHash) {
  await sql`UPDATE usuarios SET senha_hash = ${novoHash} WHERE id = ${id}`;
}

// Apaga a conta; perfil, currículos, sessões e pedidos de recuperação vão junto (ON DELETE CASCADE).
export async function excluir(id) {
  await sql`DELETE FROM usuarios WHERE id = ${id}`;
}
