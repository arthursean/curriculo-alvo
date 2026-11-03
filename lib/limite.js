import "server-only";
import { sql } from "./db";

// Registra a tentativa e diz se a chave passou do limite na janela de tempo.
export async function excedeuLimite(chave, maximo, janelaMinutos) {
  await sql`DELETE FROM tentativas WHERE criado_em < now() - interval '1 day'`;
  const [{ total }] = await sql`
    SELECT count(*)::int AS total FROM tentativas
    WHERE chave = ${chave} AND criado_em > now() - make_interval(mins => ${janelaMinutos})`;
  if (total >= maximo) return true;
  await sql`INSERT INTO tentativas (chave) VALUES (${chave})`;
  return false;
}

export async function limparTentativas(chave) {
  await sql`DELETE FROM tentativas WHERE chave = ${chave}`;
}

export const muitasTentativas = () =>
  Response.json({ erro: "Muitas tentativas. Aguarde alguns minutos e tente de novo." }, { status: 429 });
