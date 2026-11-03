import { sql } from "@/lib/db";
import { excedeuLimite, muitasTentativas } from "@/lib/limite";
import { erro, lerJson, rota } from "@/lib/requisicao";
import { gerarHashSenha, normalizarEmail, validarSenha } from "@/lib/seguranca";
import { criarSessao, ipCliente } from "@/lib/sessao";

export const POST = rota(async (req) => {
  const { corpo, falha } = await lerJson(req);
  if (falha) return falha;

  if (await excedeuLimite(`cadastro:${await ipCliente()}`, 5, 60)) return muitasTentativas();

  const nome = String(corpo.nome || "").trim().slice(0, 120);
  const email = normalizarEmail(corpo.email);
  if (!nome) return erro("Informe seu nome.");
  if (!email) return erro("E-mail inválido.");
  const problema = validarSenha(corpo.senha);
  if (problema) return erro(problema);

  const hash = await gerarHashSenha(corpo.senha);
  const [novo] = await sql`
    INSERT INTO usuarios (email, nome, senha_hash) VALUES (${email}, ${nome}, ${hash})
    ON CONFLICT (email) DO NOTHING RETURNING id`;
  if (!novo) return erro("Já existe uma conta com este e-mail. Entre ou recupere a senha.", 409);

  await criarSessao(novo.id);
  return Response.json({ ok: true });
});
