// Cria as tabelas no banco apontado por DATABASE_URL.
// Uso: npm run db:setup   (lê o arquivo .env.local)
import { readFile } from "node:fs/promises";
import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  console.error("Defina DATABASE_URL no arquivo .env.local antes de rodar.");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);
const schema = await readFile(new URL("../src/backend/db/schema.sql", import.meta.url), "utf8");
const comandos = schema
  .split("\n")
  .filter((l) => !l.trim().startsWith("--"))
  .join("\n")
  .split(";")
  .map((c) => c.trim())
  .filter(Boolean);

for (const c of comandos) await sql.query(c);
console.log(`Banco pronto (${comandos.length} comandos executados).`);
