import { importarCurriculo, TAMANHO_MAXIMO } from "@/backend/servicos/importar";
import { ErroApp } from "@/backend/http/erros";
import { exigirOrigem, exigirUsuario, json, rota } from "@/backend/http/requisicao";

export const runtime = "nodejs";

// Recebe o currículo (multipart) e devolve os dados lidos. Nada é salvo aqui: o usuário revisa
// e aplica no perfil pela tela.
export const POST = rota(async (req) => {
  await exigirOrigem(req);
  const u = await exigirUsuario();
  if (Number(req.headers.get("content-length") || 0) > TAMANHO_MAXIMO + 50_000) throw new ErroApp("Arquivo maior que 3 MB.", 413);
  let form;
  try {
    form = await req.formData();
  } catch {
    throw new ErroApp("Envie o arquivo pelo formulário.");
  }
  return json(await importarCurriculo(u.id, form.get("arquivo")));
});
