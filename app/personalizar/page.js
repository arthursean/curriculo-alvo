"use client";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Curriculo from "@/components/Curriculo";
import { personalizar } from "@/lib/personalizar";
import { carregarCurriculos, carregarPerfil, lerVagaAtual, perfilCompleto, salvarCurriculo, useProtegido } from "@/lib/cliente";

async function carregar() {
  const [perfil, curriculos] = await Promise.all([carregarPerfil(), carregarCurriculos()]);
  return { perfil, curriculos };
}

function Personalizar() {
  const vagaId = useSearchParams().get("vaga");
  const { dados, erro: erroCarga } = useProtegido(carregar);
  const [vaga, setVaga] = useState(null);
  const [ajuste, setAjuste] = useState(null);
  const [erro, setErro] = useState("");
  const [salvo, setSalvo] = useState(false);

  function gerar(perfil, v) {
    const novo = personalizar(perfil, v);
    setAjuste(novo);
    setSalvo(false);
    salvarCurriculo(v, novo).then(() => setSalvo(true)).catch((e) => setErro(`Não foi possível salvar: ${e.message}`));
  }

  useEffect(() => {
    if (!dados) return;
    const existente = dados.curriculos.find((c) => c.vaga.id === vagaId);
    if (existente) {
      setVaga(existente.vaga);
      setAjuste(existente.ajuste);
      setSalvo(true);
      return;
    }
    const atual = lerVagaAtual();
    if (atual && atual.id === vagaId) {
      setVaga(atual);
      if (perfilCompleto(dados.perfil)) gerar(dados.perfil, atual);
    }
  }, [dados, vagaId]);

  if (erroCarga) return <div className="alerta">{erroCarga}</div>;
  if (!dados) return <div className="vazio">Carregando…</div>;
  const { perfil } = dados;
  if (!vaga) {
    return <div className="card vazio">Vaga não encontrada. <Link href="/vagas">Volte à busca</Link> e escolha uma vaga.</div>;
  }

  return (
    <div className="stack">
      <div className="card nao-imprimir stack">
        <div className="row between" style={{ alignItems: "start" }}>
          <div style={{ flex: 1, minWidth: 240 }}>
            <p className="muted small" style={{ margin: 0 }}>Currículo personalizado para</p>
            <h1 style={{ margin: "2px 0" }}>{vaga.titulo}</h1>
            <div className="muted">{vaga.empresa} · {vaga.local}</div>
          </div>
          <div className="row">
            <a className="btn sec" href={vaga.url} target="_blank" rel="noopener noreferrer">Ver vaga ↗</a>
            <button className="btn sec" disabled={!perfilCompleto(perfil)} onClick={() => gerar(perfil, vaga)}>Gerar novamente</button>
            <button className="btn" disabled={!ajuste} onClick={() => window.print()}>Imprimir / PDF</button>
          </div>
        </div>

        {!perfilCompleto(perfil) && (
          <div className="alerta">Preencha <Link href="/perfil">seu perfil</Link> (nome e competências ou experiências) antes de gerar o currículo.</div>
        )}
        {erro && <div className="alerta">{erro}</div>}

        {ajuste && (
          <div className="grid-2">
            <div>
              <div className="row between small"><strong>Compatibilidade estimada</strong><span>{ajuste.compatibilidade}%</span></div>
              <div className="barra" style={{ marginTop: 6 }}><div style={{ width: `${ajuste.compatibilidade}%` }} /></div>
              <p className="muted small" style={{ marginTop: 8 }}>
                Competências e tópicos reordenados pelo que a vaga pede; resumo montado com fatos do seu perfil. {salvo && "Salvo na sua conta."}
              </p>
              {ajuste.atendidos?.length > 0 && (
                <>
                  <strong className="small">Você atende</strong>
                  <div className="tags" style={{ marginTop: 6 }}>{ajuste.atendidos.map((d) => <span key={d} className="tag ok">{d}</span>)}</div>
                </>
              )}
            </div>
            <div>
              {ajuste.lacunas?.length > 0 && (
                <>
                  <strong className="small">A vaga pede, mas não aparece no seu perfil</strong>
                  <div className="tags" style={{ margin: "6px 0 12px" }}>{ajuste.lacunas.map((d) => <span key={d} className="tag warn">{d}</span>)}</div>
                </>
              )}
              {ajuste.dicas?.length > 0 && (
                <>
                  <strong className="small">Dicas</strong>
                  <ul className="small" style={{ margin: "4px 0 0", paddingLeft: 18 }}>{ajuste.dicas.map((d) => <li key={d}>{d}</li>)}</ul>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {ajuste && <Curriculo perfil={perfil} ajuste={ajuste} />}
    </div>
  );
}

export default function Pagina() {
  return (
    <Suspense fallback={null}>
      <Personalizar />
    </Suspense>
  );
}
