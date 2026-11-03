import "server-only";
import { createHash, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);

// scrypt (memory-hard) com sal aleatório por usuário. Parâmetros ficam gravados junto do hash
// para poderem ser aumentados no futuro sem invalidar senhas antigas.
const N = 2 ** 15;
const R = 8;
const P = 1;
const TAMANHO = 64;
const MAXMEM = 128 * N * R * 2;

export async function gerarHashSenha(senha) {
  const sal = randomBytes(16);
  const hash = await scryptAsync(senha.normalize("NFKC"), sal, TAMANHO, { N, r: R, p: P, maxmem: MAXMEM });
  return `scrypt$${N}$${R}$${P}$${sal.toString("base64")}$${hash.toString("base64")}`;
}

export async function conferirSenha(senha, armazenado) {
  const [alg, n, r, p, sal, hash] = String(armazenado).split("$");
  if (alg !== "scrypt") return false;
  const esperado = Buffer.from(hash, "base64");
  const calculado = await scryptAsync(senha.normalize("NFKC"), Buffer.from(sal, "base64"), esperado.length, {
    N: Number(n), r: Number(r), p: Number(p), maxmem: 128 * Number(n) * Number(r) * 2,
  });
  return timingSafeEqual(esperado, calculado);
}

// Hash usado quando o e-mail não existe, para o login levar o mesmo tempo (não revela contas).
let hashFalso;
export async function conferirSenhaFalsa(senha) {
  hashFalso ??= await gerarHashSenha("senha-inexistente");
  await conferirSenha(senha, hashFalso);
  return false;
}

export const gerarToken = () => randomBytes(32).toString("base64url");
export const hashToken = (token) => createHash("sha256").update(token).digest("hex");

export function validarSenha(senha) {
  if (typeof senha !== "string" || senha.length < 8) return "A senha precisa ter pelo menos 8 caracteres.";
  if (senha.length > 200) return "Senha longa demais.";
  if (!/[a-zA-Z]/.test(senha) || !/\d/.test(senha)) return "Use letras e números na senha.";
  return null;
}

export function normalizarEmail(email) {
  const e = String(email || "").trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) && e.length <= 254 ? e : null;
}
