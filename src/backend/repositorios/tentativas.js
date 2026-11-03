import "server-only";
import { sql } from "@/backend/db/cliente";

export async function limparAntigas() {
  await sql`DELETE FROM tentativas WHERE criado_em < now() - interval '1 day'`;
}

export async function contar(chave, janelaMinutos) {
  const [{ total }] = await sql`
    SELECT count(*)::int AS total FROM tentativas
    WHERE chave = ${chave} AND criado_em > now() - make_interval(mins => ${janelaMinutos})`;
  return total;
}

export async function registrar(chave) {
  await sql`INSERT INTO tentativas (chave) VALUES (${chave})`;
}

export async function limpar(chave) {
  await sql`DELETE FROM tentativas WHERE chave = ${chave}`;
}
