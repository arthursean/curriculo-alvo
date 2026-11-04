// Nome do cookie da sessão: usado pelo backend (cria e valida a sessão) e pelas páginas
// (só para saber se há alguém logado e redirecionar; a validação real é sempre no backend).
export const COOKIE_SESSAO = "ca_sessao";

// Para onde vai quem já está logado.
export const PAGINA_INICIAL_LOGADO = "/vagas";
