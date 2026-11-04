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
// Valores em lista (ex.: area: ["dados", "design"]) viram parâmetros repetidos (?area=dados&area=design).
export function buscarVagas(params) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) for (const item of [].concat(v)) if (item !== undefined && item !== "") p.append(k, item);
  return api(`/api/vagas?${p}`);
}
// Cidades de um estado (lista fixa do servidor). Guardadas na memória: não mudam.
const cacheCidades = new Map();
export function cidadesDoEstado(uf) {
  if (!uf) return Promise.resolve([]);
  if (!cacheCidades.has(uf)) {
    cacheCidades.set(uf, api(`/api/municipios?uf=${encodeURIComponent(uf)}`).then((d) => d.cidades).catch((e) => {
      cacheCidades.delete(uf);
      throw e;
    }));
  }
  return cacheCidades.get(uf);
}

export const carregarFavoritos =async () => (await api("/api/favoritos")).favoritos;
export const favoritar = (vaga) => api("/api/favoritos", { metodo: "POST", corpo: { vaga } });
export const desfavoritar = (vagaId) => api(`/api/favoritos?vaga=${encodeURIComponent(vagaId)}`, { metodo: "DELETE" });

// Envia o arquivo do currículo (PDF/DOCX/TXT) e recebe os dados lidos, sem salvar nada.
export async function importarCurriculo(arquivo) {
  const form = new FormData();
  form.append("arquivo", arquivo);
  const res = await fetch("/api/importar", { method: "POST", body: form });
  const dados = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(dados.erro || "Não foi possível ler o arquivo.");
  return dados;
}
