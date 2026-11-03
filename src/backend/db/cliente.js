import "server-only";
import { neon } from "@neondatabase/serverless";
import { COMANDOS_SCHEMA } from "./schema.mjs";

let cliente;
let estruturaPronta;

// Na primeira consulta de cada instância do servidor, garante que as tabelas existem
// (CREATE ... IF NOT EXISTS). Assim um banco novo — como o de produção recém-criado — funciona
// sem passo manual. Se falhar, tenta de novo na próxima requisição.
function garantirEstrutura() {
  estruturaPronta ??= (async () => {
    for (const comando of COMANDOS_SCHEMA) await cliente.query(comando);
  })().catch((e) => {
    estruturaPronta = null;
    throw e;
  });
  return estruturaPronta;
}

// Conexão preguiçosa: o build não precisa de DATABASE_URL, só as requisições.
export async function sql(strings, ...valores) {
  if (!cliente) {
    if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL não configurada");
    cliente = neon(process.env.DATABASE_URL);
  }
  await garantirEstrutura();
  return cliente(strings, ...valores);
}
