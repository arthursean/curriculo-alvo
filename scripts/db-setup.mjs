// Cria as tabelas no banco apontado por DATABASE_URL (o site também faz isso sozinho no primeiro acesso).
// Uso: npm run db:setup   (lê o arquivo .env.local)
import { neon } from "@neondatabase/serverless";
import { COMANDOS_SCHEMA } from "../src/backend/db/schema.mjs";

if (!process.env.DATABASE_URL) {
  console.error("Defina DATABASE_URL no arquivo .env.local antes de rodar.");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);
for (const c of COMANDOS_SCHEMA) await sql.query(c);
console.log(`Banco pronto (${COMANDOS_SCHEMA.length} comandos executados).`);
