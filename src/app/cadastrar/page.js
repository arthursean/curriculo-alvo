"use client";
import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import FormConta from "@/frontend/components/FormConta";
import { cadastrar } from "@/frontend/lib/api";
import { destinoSeguro } from "@/frontend/lib/navegacao";
import { useSaiSeLogado } from "@/frontend/hooks/useSaiSeLogado";

function Cadastrar() {
  const param = useSearchParams().get("voltar");
  // Conta nova vai primeiro preencher o perfil; quem já está logado vai para as vagas.
  const voltar = destinoSeguro(param, "/perfil");
  if (useSaiSeLogado(destinoSeguro(param))) return null;
  return (
    <FormConta
      titulo="Criar conta"
      subtitulo="Grátis. Sua senha é guardada com hash, nunca em texto."
      campos={[
        { nome: "nome", rotulo: "Nome", autocomplete: "name" },
        { nome: "email", rotulo: "E-mail", tipo: "email", autocomplete: "email" },
        { nome: "senha", rotulo: "Senha", tipo: "password", autocomplete: "new-password", minimo: 8, ajuda: "Mínimo de 8 caracteres, com letras e números." },
        { nome: "confirmar", rotulo: "Confirme a senha", tipo: "password", autocomplete: "new-password", minimo: 8 },
      ]}
      botao="Criar conta"
      enviar={async ({ confirmar, ...v }) => {
        if (v.senha !== confirmar) throw new Error("As senhas não conferem.");
        await cadastrar(v);
        window.location.href = voltar;
      }}
      rodape={<>Já tem conta? <Link href="/entrar">Entrar</Link></>}
    />
  );
}

export default function Pagina() {
  return <Suspense fallback={null}><Cadastrar /></Suspense>;
}
