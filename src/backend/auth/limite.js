import "server-only";
import * as tentativas from "@/backend/repositorios/tentativas";

// Registra a tentativa e diz se a chave passou do limite na janela de tempo (anti força bruta).
export async function excedeuLimite(chave, maximo, janelaMinutos) {
  await tentativas.limparAntigas();
  if ((await tentativas.contar(chave, janelaMinutos)) >= maximo) return true;
  await tentativas.registrar(chave);
  return false;
}

export const limparTentativas = (chave) => tentativas.limpar(chave);
