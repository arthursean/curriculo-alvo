"use client";
import Link from "next/link";
import FormConta from "@/components/FormConta";
import { api } from "@/lib/cliente";

export default function EsqueciSenha() {
  return (
    <FormConta
      titulo="Recuperar senha"
      subtitulo="Enviaremos um link para você criar uma nova senha."
      campos={[{ nome: "email", rotulo: "E-mail da conta", tipo: "email", autocomplete: "email" }]}
      botao="Enviar link"
      enviar={async (v) => (await api("/api/auth/esqueci", { metodo: "POST", corpo: v })).mensagem}
      rodape={<><Link href="/entrar">Voltar ao login</Link> · Não chegou? Confira o spam e aguarde alguns minutos.</>}
    />
  );
}
