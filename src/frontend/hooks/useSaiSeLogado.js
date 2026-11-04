"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usuarioLogado } from "@/frontend/lib/api";

// Telas de entrar/cadastrar: se a pessoa já tem sessão válida, vai direto para `destino`.
// Devolve true enquanto ainda está conferindo (para não piscar o formulário).
export function useSaiSeLogado(destino) {
  const router = useRouter();
  const [conferindo, setConferindo] = useState(true);
  useEffect(() => {
    let vivo = true;
    usuarioLogado()
      .then((u) => {
        if (u) router.replace(destino);
        else if (vivo) setConferindo(false);
      })
      .catch(() => vivo && setConferindo(false));
    return () => {
      vivo = false;
    };
  }, [destino, router]);
  return conferindo;
}
