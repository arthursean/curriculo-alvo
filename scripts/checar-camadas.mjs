// Confere as regras de dependência entre as camadas (rode: npm run checar).
//   shared   -> não importa frontend nem backend (roda nos dois lados)
//   frontend -> não importa backend (código do servidor nunca vai para o navegador)
//   backend  -> não importa frontend
//   app/api  -> só backend e shared;  páginas (app) -> só frontend e shared
import { readdir, readFile } from "node:fs/promises";
import { join, relative, sep } from "node:path";

const raiz = new URL("../src", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");

const PROIBIDO = [
  { de: "shared/", nao: ["@/frontend", "@/backend"] },
  { de: "frontend/", nao: ["@/backend"] },
  { de: "backend/", nao: ["@/frontend"] },
  { de: "app/api/", nao: ["@/frontend"] },
  { de: "app/", exceto: "app/api/", nao: ["@/backend"] },
];

async function arquivos(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...(await arquivos(p)));
    else if (/\.(js|jsx|mjs)$/.test(e.name)) out.push(p);
  }
  return out;
}

const erros = [];
for (const f of await arquivos(raiz)) {
  const rel = relative(raiz, f).split(sep).join("/");
  const codigo = await readFile(f, "utf8");
  const imports = [...codigo.matchAll(/from\s+["']([^"']+)["']/g)].map((m) => m[1]);
  for (const regra of PROIBIDO) {
    if (!rel.startsWith(regra.de) || (regra.exceto && rel.startsWith(regra.exceto))) continue;
    for (const i of imports) if (regra.nao.some((n) => i.startsWith(n))) erros.push(`${rel} importa ${i}`);
  }
}

if (erros.length) {
  console.error("Violações de camada:\n" + erros.map((e) => `  - ${e}`).join("\n"));
  process.exit(1);
}
console.log("Camadas OK: nenhuma importação proibida.");
