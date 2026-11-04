import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE_SESSAO, PAGINA_INICIAL_LOGADO } from "@/shared/sessao";

const PASSOS = [
  ["Crie seu perfil", "Competências, experiências, formação, idiomas e certificações, salvos com segurança na sua conta."],
  ["Busque vagas", "Digite palavras-chave e filtre por área, modalidade (remoto, híbrido, presencial), data e nível."],
  ["Gere o currículo da vaga", "Para cada vaga escolhida, um currículo reorganizado pelo que ela pede, com compatibilidade e dicas, pronto para PDF."],
];

export default async function Inicio() {
  // Quem já está logado vai direto para as vagas (decidido no servidor, sem piscar esta tela).
  // Basta o cookie existir: se a sessão tiver expirado, a página de vagas manda para o login.
  if ((await cookies()).get(COOKIE_SESSAO)?.value) redirect(PAGINA_INICIAL_LOGADO);

  return (
    <>
      <section className="hero">
        <h1>Um currículo sob medida para cada vaga que você quer.</h1>
        <p>Monte seu perfil uma vez, encontre vagas-alvo e deixe o Currículo Alvo adaptar seu currículo ao que cada empresa procura. Sem IA paga: um algoritmo próprio faz o trabalho.</p>
        <div className="row" style={{ marginTop: 20 }}>
          <Link href="/cadastrar" className="btn">Criar conta grátis</Link>
          <Link href="/entrar" className="btn sec">Já tenho conta</Link>
        </div>
      </section>
      <section className="passos">
        {PASSOS.map(([titulo, texto], i) => (
          <div key={titulo} className="card passo">
            <div className="n">{i + 1}</div>
            <h3>{titulo}</h3>
            <p className="muted" style={{ margin: 0 }}>{texto}</p>
          </div>
        ))}
      </section>
    </>
  );
}
