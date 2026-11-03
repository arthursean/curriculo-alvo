import "server-only";
import { origemValida } from "./sessao";

const LIMITE_BYTES = 200_000;

export const erro = (mensagem, status = 400) => Response.json({ erro: mensagem }, { status });

// Lê o corpo JSON com limite de tamanho e checagem de origem (CSRF).
export async function lerJson(req) {
  if (!(await origemValida(req))) return { falha: erro("Origem não permitida.", 403) };
  const texto = await req.text();
  if (texto.length > LIMITE_BYTES) return { falha: erro("Dados grandes demais.", 413) };
  try {
    return { corpo: JSON.parse(texto || "{}") };
  } catch {
    return { falha: erro("JSON inválido.") };
  }
}

// Envolve a rota para que erros inesperados não vazem detalhes internos.
export function rota(fn) {
  return async (req, ctx) => {
    try {
      return await fn(req, ctx);
    } catch (e) {
      console.error(e);
      return erro("Erro interno. Tente novamente.", 500);
    }
  };
}
