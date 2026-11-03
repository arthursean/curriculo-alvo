"use client";
import Link from "next/link";
import Curriculo from "@/frontend/components/Curriculo";
import { carregarPerfil } from "@/frontend/lib/api";
import { useProtegido } from "@/frontend/hooks/useProtegido";
import { perfilCompleto } from "@/shared/perfil";

export default function CurriculoBase() {
  const { dados: perfil, erro } = useProtegido(carregarPerfil);
  if (erro) return <div className="alerta">{erro}</div>;
  if (!perfil) return <div className="vazio">Carregando…</div>;

  return (
    <div className="stack">
      <div className="row between nao-imprimir">
        <div>
          <h1>Currículo base</h1>
          <p className="muted" style={{ margin: 0 }}>Gerado a partir do seu perfil. Use “Imprimir / PDF” e escolha “Salvar como PDF”.</p>
        </div>
        <div className="row">
          <Link href="/perfil" className="btn sec">Editar perfil</Link>
          <button className="btn" onClick={() => window.print()}>Imprimir / PDF</button>
        </div>
      </div>
      {!perfilCompleto(perfil) && (
        <div className="alerta nao-imprimir">Seu perfil ainda está vazio. <Link href="/perfil">Preencha o perfil</Link> para montar o currículo.</div>
      )}
      <Curriculo perfil={perfil} />
    </div>
  );
}
