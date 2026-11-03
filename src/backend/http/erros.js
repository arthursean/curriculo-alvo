// Erro de regra de negócio: os serviços lançam, a camada HTTP vira resposta com o status certo.
// Assim os serviços não dependem de Request/Response.
export class ErroApp extends Error {
  constructor(mensagem, status = 400) {
    super(mensagem);
    this.status = status;
  }
}

export const naoAutenticado = () => new ErroApp("Entre na sua conta para continuar.", 401);
export const muitasTentativas = () => new ErroApp("Muitas tentativas. Aguarde alguns minutos e tente de novo.", 429);
