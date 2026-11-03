import { usuarioAtual } from "@/backend/auth/sessao";
import { json, rota } from "@/backend/http/requisicao";

export const GET = rota(async () => json({ usuario: await usuarioAtual() }));
