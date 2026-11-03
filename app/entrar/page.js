"use client";
import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import FormConta from "@/components/FormConta";
import { api, destinoSeguro } from "@/lib/cliente";

function Entrar() {
  const voltar = destinoSeguro(useSearchParams().get("voltar"));
  return (
    <FormConta
      titulo="Entrar"
      subtitulo="Acesse seu perfil e seus currículos."
      campos={[
        { nome: "email", rotulo: "E-mail", tipo: "email", autocomplete: "email" },
        { nome: "senha", rotulo: "Senha", tipo: "password", autocomplete: "current-password" },
      ]}
      botao="Entrar"
      enviar={async (v) => {
        await api("/api/auth/entrar", { metodo: "POST", corpo: v });
        // Recarrega a página inteira para o menu refletir a sessão.
        window.location.href = voltar;
      }}
      rodape={<><Link href="/esqueci-senha">Esqueci minha senha</Link> · Não tem conta? <Link href={`/cadastrar?voltar=${encodeURIComponent(voltar)}`}>Cadastre-se</Link></>}
    />
  );
}

export default function Pagina() {
  return <Suspense fallback={null}><Entrar /></Suspense>;
}
