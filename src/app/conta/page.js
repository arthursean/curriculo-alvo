"use client";
import FormConta from "@/frontend/components/FormConta";
import { carregarPerfil, excluirConta, trocarSenha } from "@/frontend/lib/api";
import { useProtegido } from "@/frontend/hooks/useProtegido";

export default function Conta() {
  const { dados } = useProtegido(carregarPerfil);
  if (!dados) return <div className="vazio">Carregando…</div>;

  return (
    <div className="stack">
      <FormConta
        titulo="Trocar senha"
        subtitulo={`Conta: ${dados.email}`}
        campos={[
          { nome: "senhaAtual", rotulo: "Senha atual", tipo: "password", autocomplete: "current-password" },
          { nome: "novaSenha", rotulo: "Nova senha", tipo: "password", autocomplete: "new-password", minimo: 8, ajuda: "Mínimo de 8 caracteres, com letras e números." },
        ]}
        botao="Trocar senha"
        enviar={async (v) => {
          await trocarSenha(v);
          return "Senha alterada.";
        }}
      />
      <FormConta
        titulo="Excluir conta"
        subtitulo="Apaga definitivamente sua conta, seu perfil e todos os currículos salvos."
        campos={[{ nome: "senha", rotulo: "Confirme com sua senha", tipo: "password", autocomplete: "current-password" }]}
        botao="Excluir minha conta"
        enviar={async (v) => {
          if (!window.confirm("Tem certeza? Isso não pode ser desfeito.")) return;
          await excluirConta(v.senha);
          window.location.href = "/";
        }}
      />
    </div>
  );
}
