"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Curriculo from "@/frontend/components/Curriculo";
import CurriculoEditavel from "@/frontend/components/CurriculoEditavel";
import { carregarPerfil, salvarPerfil } from "@/frontend/lib/api";
import { useProtegido } from "@/frontend/hooks/useProtegido";
import { perfilCompleto } from "@/shared/perfil";
import { estavel } from "@/shared/texto";
import { detectarIdiomaPerfil } from "@/shared/traducao";
import { visualValido } from "@/shared/modelos";
import SeletorVisual from "@/frontend/components/SeletorVisual";

export default function CurriculoBase() {
  const { dados, erro: erroCarga } = useProtegido(carregarPerfil);
  const [perfil, setPerfil] = useState(null);
  const [erro, setErro] = useState("");
  useEffect(() => setPerfil(dados), [dados]);

  if (erroCarga) return <div className="alerta">{erroCarga}</div>;
  if (!perfil) return <div className="vazio">Carregando…</div>;

  // A formatação vale só para o conteúdo em que foi feita: mudou o perfil, ela é ignorada.
  // (O visual — modelo e cor — não entra: trocar de modelo mantém a formatação.)
  const { edicaoBase, visual, ...conteudo } = perfil;
  const assinatura = estavel(conteudo);
  const htmlSalvo = edicaoBase?.assinatura === assinatura ? edicaoBase.html : null;

  // A formatação e o visual do currículo ficam guardados junto do perfil.
  async function guardar(mudanca) {
    const novo = { ...perfil, ...mudanca };
    setPerfil(novo);
    try {
      await salvarPerfil(novo);
    } catch (e) {
      setErro(`Não foi possível salvar: ${e.message}`);
    }
  }

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
      {erro && <div className="alerta nao-imprimir">{erro}</div>}
      <SeletorVisual {...visualValido(visual)} onChange={(v) => guardar({ visual: v })} />
      <CurriculoEditavel
        visual={visual}
        htmlSalvo={htmlSalvo}
        onSalvar={(html) => guardar({ edicaoBase: { html, assinatura, em: new Date().toISOString() } })}
        onDescartar={() => guardar({ edicaoBase: null })}
      >
        <Curriculo perfil={perfil} idioma={detectarIdiomaPerfil(perfil)} />
      </CurriculoEditavel>
    </div>
  );
}
