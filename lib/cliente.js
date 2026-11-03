"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export const perfilVazio = {
  nome: "",
  titulo: "",
  email: "",
  telefone: "",
  cidade: "",
  linkedin: "",
  site: "",
  resumo: "",
  competencias: [],
  experiencias: [],
  formacao: [],
  idiomas: [],
  certificacoes: [],
};

export class NaoLogado extends Error {}

export async function api(caminho, { metodo = "GET", corpo } = {}) {
  const res = await fetch(caminho, {
    method: metodo,
    headers: corpo ? { "Content-Type": "application/json" } : undefined,
    body: corpo ? JSON.stringify(corpo) : undefined,
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && !caminho.startsWith("/api/auth/") && !caminho.startsWith("/api/conta")) throw new NaoLogado();
  if (!res.ok) throw new Error(data.erro || "Algo deu errado.");
  return data;
}

// Carrega dados de uma página protegida; sem sessão, manda para o login e volta depois.
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

export async function carregarPerfil() {
  const { perfil, usuario } = await api("/api/perfil");
  return { ...perfilVazio, nome: usuario.nome, email: usuario.email, ...(perfil || {}) };
}

export const salvarPerfil = (perfil) => api("/api/perfil", { metodo: "PUT", corpo: { perfil } });
export const carregarCurriculos = async () => (await api("/api/curriculos")).curriculos;
export const salvarCurriculo = (vaga, ajuste) => api("/api/curriculos", { metodo: "POST", corpo: { vaga, ajuste } });
export const removerCurriculo = (vagaId) => api(`/api/curriculos?vaga=${encodeURIComponent(vagaId)}`, { metodo: "DELETE" });

// A vaga escolhida passa da busca para a página de personalização pela aba atual.
export function guardarVagaAtual(vaga) {
  try {
    sessionStorage.setItem("ca:vaga-atual", JSON.stringify(vaga));
  } catch { /* armazenamento indisponível */ }
}
export function lerVagaAtual() {
  try {
    return JSON.parse(sessionStorage.getItem("ca:vaga-atual") || "null");
  } catch {
    return null;
  }
}

export const novoId = () => Math.random().toString(36).slice(2, 10);

export function perfilCompleto(p) {
  return Boolean(p?.nome && (p.competencias.length || p.experiencias.length));
}

// Só aceita caminhos internos no "voltar" para não virar redirecionamento aberto.
export function destinoSeguro(voltar) {
  return voltar && voltar.startsWith("/") && !voltar.startsWith("//") ? voltar : "/perfil";
}
