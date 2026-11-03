"use client";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import FormConta from "@/components/FormConta";
import { api } from "@/lib/cliente";

function Redefinir() {
  const [token, setToken] = useState(null);

  // Tira o token da barra de endereço (histórico, prints) assim que a página abre.
  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("token") || "";
    setToken(t);
    if (t) window.history.replaceState(null, "", "/redefinir-senha");
  }, []);

  if (token === null) return null;
  if (!token) {
    return <div className="card auth vazio">Link inválido. <Link href="/esqueci-senha">Peça um novo link</Link>.</div>;
  }

  return (
    <FormConta
      titulo="Criar nova senha"
      campos={[
        { nome: "senha", rotulo: "Nova senha", tipo: "password", autocomplete: "new-password", minimo: 8, ajuda: "Mínimo de 8 caracteres, com letras e números." },
        { nome: "confirmar", rotulo: "Confirme a nova senha", tipo: "password", autocomplete: "new-password", minimo: 8 },
      ]}
      botao="Salvar nova senha"
      enviar={async ({ senha, confirmar }) => {
        if (senha !== confirmar) throw new Error("As senhas não conferem.");
        await api("/api/auth/redefinir", { metodo: "POST", corpo: { token, senha } });
        window.location.href = "/perfil";
      }}
      rodape={<>Por segurança, todos os aparelhos conectados à sua conta serão desconectados.</>}
    />
  );
}

export default function Pagina() {
  return <Suspense fallback={null}><Redefinir /></Suspense>;
}
