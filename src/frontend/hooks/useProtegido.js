"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { NaoLogado } from "@/frontend/lib/api";

// Carrega os dados de uma página que exige login; sem sessão, manda para o login e volta depois.
export function useProtegido(carregar) {
  const router = useRouter();
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState("");
  useEffect(() => {
    let vivo = true;
    carregar()
      .then((d) => vivo && setDados(d))
      .catch((e) => {
        if (e instanceof NaoLogado) router.replace(`/entrar?voltar=${encodeURIComponent(location.pathname + location.search)}`);
        else if (vivo) setErro(e.message);
      });
    return () => {
      vivo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return { dados, erro };
}
