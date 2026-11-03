"use client";

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
export function destinoSeguro(voltar) {
  return voltar && voltar.startsWith("/") && !voltar.startsWith("//") ? voltar : "/perfil";
}
