"use client";
import { perfilVazio } from "@/shared/perfil";

// Cliente da API do backend (rotas em src/app/api). Único lugar do frontend que faz fetch para o servidor.

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

// ---- Conta --------------------------------------------------------------------------
export const cadastrar = (dados) => api("/api/auth/cadastro", { metodo: "POST", corpo: dados });
export const entrar = (dados) => api("/api/auth/entrar", { metodo: "POST", corpo: dados });
export const sair = () => api("/api/auth/sair", { metodo: "POST" });
export const usuarioLogado = async () => (await api("/api/auth/eu")).usuario;
export const pedirRecuperacao = async (email) => (await api("/api/auth/esqueci", { metodo: "POST", corpo: { email } })).mensagem;
export const redefinirSenha = (token, senha) => api("/api/auth/redefinir", { metodo: "POST", corpo: { token, senha } });
export const trocarSenha = (dados) => api("/api/conta", { metodo: "PUT", corpo: dados });
export const excluirConta = (senha) => api("/api/conta", { metodo: "DELETE", corpo: { senha } });

// ---- Perfil e currículos ------------------------------------------------------------
export async function carregarPerfil() {
  const { perfil, usuario } = await api("/api/perfil");
  return { ...perfilVazio, nome: usuario.nome, email: usuario.email, ...(perfil || {}) };
}

export const salvarPerfil = (perfil) => api("/api/perfil", { metodo: "PUT", corpo: { perfil } });
export const carregarCurriculos = async () => (await api("/api/curriculos")).curriculos;
export const salvarCurriculo = (vaga, ajuste) => api("/api/curriculos", { metodo: "POST", corpo: { vaga, ajuste } });
export const removerCurriculo = (vagaId) => api(`/api/curriculos?vaga=${encodeURIComponent(vagaId)}`, { metodo: "DELETE" });

// ---- Vagas --------------------------------------------------------------------------
export const buscarVagas = (params) => api(`/api/vagas?${new URLSearchParams(params)}`);
export const carregarFavoritos = async () => (await api("/api/favoritos")).favoritos;
export const favoritar = (vaga) => api("/api/favoritos", { metodo: "POST", corpo: { vaga } });
export const desfavoritar = (vagaId) => api(`/api/favoritos?vaga=${encodeURIComponent(vagaId)}`, { metodo: "DELETE" });
