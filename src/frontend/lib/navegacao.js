"use client";
import { PAGINA_INICIAL_LOGADO } from "@/shared/sessao";

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

// Só aceita caminhos internos no "voltar" para não virar redirecionamento aberto.
// Sem "voltar", quem entra vai para as vagas.
export function destinoSeguro(voltar, padrao = PAGINA_INICIAL_LOGADO) {
  return voltar && voltar.startsWith("/") && !voltar.startsWith("//") ? voltar : padrao;
}
