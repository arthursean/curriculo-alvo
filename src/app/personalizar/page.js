"use client";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Curriculo from "@/frontend/components/Curriculo";
import CurriculoEditavel from "@/frontend/components/CurriculoEditavel";
import { personalizar } from "@/shared/personalizar";
import { detectarIdioma, IDIOMAS_CV } from "@/shared/traducao";
import { traduzirCurriculo } from "@/frontend/lib/tradutor";
import { carregarCurriculos, carregarPerfil, salvarCurriculo } from "@/frontend/lib/api";
import { lerVagaAtual } from "@/frontend/lib/navegacao";
import { useProtegido } from "@/frontend/hooks/useProtegido";
import { perfilCompleto } from "@/shared/perfil";

const NOME_IDIOMA = Object.fromEntries(IDIOMAS_CV.map((i) => [i.id, i.nome]));

// JSON com as chaves em ordem: o banco (JSONB) devolve os objetos com as chaves reordenadas,
// então uma comparação com JSON.stringify comum acharia diferença onde não há.
function estavel(valor) {
  return JSON.stringify(valor ?? null, (_, v) =>
    v && typeof v === "object" && !Array.isArray(v) ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, v[k]])) : v);
}

async function carregar() {
  const [perfil, curriculos] = await Promise.all([carregarPerfil(), carregarCurriculos()]);
  return { perfil, curriculos };
}

function Personalizar() {
  const vagaId = useSearchParams().get("vaga");
  const { dados, erro: erroCarga } = useProtegido(carregar);
  const [vaga, setVaga] = useState(null);
  const [ajuste, setAjuste] = useState(null);
  // Versão traduzida: { idioma, perfil, ajuste, motor }
  const [traducao, setTraducao] = useState(null);
  const [idiomaAlvo, setIdiomaAlvo] = useState("pt");
  const [traduzindo, setTraduzindo] = useState("");
  const [erro, setErro] = useState("");
  const [salvo, setSalvo] = useState(false);
  // Versão editada à mão: { html, idioma, em }
  const [edicao, setEdicao] = useState(null);

  function salvar(v, aj, tr, ed) {
    setSalvo(false);
    return salvarCurriculo(v, { ...aj, traducao: tr || null, edicao: ed || null })
      .then(() => setSalvo(true))
      .catch((e) => setErro(`Não foi possível salvar: ${e.message}`));
  }

  useEffect(() => {
    if (!dados) return;
    const existente = dados.curriculos.find((c) => c.vaga.id === vagaId);
    const atual = lerVagaAtual();
    const v = existente?.vaga || (atual?.id === vagaId ? atual : null);
    if (!v) return;
    setVaga(v);
    const idiomaVaga = v.idioma || detectarIdioma(`${v.titulo}\n${v.descricao}`);
    setIdiomaAlvo(existente?.ajuste?.traducao?.idioma || idiomaVaga);
    if (!perfilCompleto(dados.perfil)) return;
    // Sempre recalcula a partir do perfil atual: se você editou o perfil, o currículo acompanha.
    const novo = personalizar(dados.perfil, v);
    setAjuste(novo);
    const tr = existente?.ajuste?.traducao;
    const perfilMudou = estavel(existente?.ajuste?.resumo) !== estavel(novo.resumo) ||
      estavel(existente?.ajuste?.experiencias) !== estavel(novo.experiencias) ||
      estavel(existente?.ajuste?.formacao) !== estavel(novo.formacao) ||
      estavel(existente?.ajuste?.projetos) !== estavel(novo.projetos);
    // A tradução salva só vale se o perfil não mudou desde então.
    const trValida = tr && !perfilMudou ? tr : null;
    setTraducao(trValida);
    // A edição manual é do usuário: é mantida mesmo que o perfil mude (ele pode descartar).
    const ed = existente?.ajuste?.edicao || null;
    setEdicao(ed);
    // Só grava no banco quando é um currículo novo ou quando o perfil mudou desde a última vez:
    // abrir de novo um currículo já salvo não gera escrita.
    if (!existente || perfilMudou || existente.ajuste?.compatibilidade !== novo.compatibilidade) salvar(v, novo, trValida, ed);
    else setSalvo(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dados, vagaId]);

  async function traduzir() {
    setErro("");
    if (idiomaAlvo === "pt") {
      setTraducao(null);
      salvar(vaga, ajuste, null, edicao);
      return;
    }
    try {
      setTraduzindo("Preparando tradução…");
      const r = await traduzirCurriculo(dados.perfil, ajuste, idiomaAlvo, setTraduzindo);
      const tr = { idioma: idiomaAlvo, perfil: r.perfil, ajuste: r.ajuste, motor: r.motor };
      setTraducao(tr);
      salvar(vaga, ajuste, tr, edicao);
    } catch (e) {
      setErro(e.message || "Falha na tradução.");
    } finally {
      setTraduzindo("");
    }
  }

  if (erroCarga) return <div className="alerta">{erroCarga}</div>;
  if (!dados) return <div className="vazio">Carregando…</div>;
  const { perfil } = dados;
  if (!vaga) {
    return <div className="card vazio">Vaga não encontrada. <Link href="/vagas">Volte à busca</Link> e escolha uma vaga.</div>;
  }

  const idiomaVaga = vaga.idioma || detectarIdioma(`${vaga.titulo}\n${vaga.descricao}`);
  const exibido = traducao ? { perfil: traducao.perfil, ajuste: traducao.ajuste, idioma: traducao.idioma } : { perfil, ajuste, idioma: "pt" };

  return (
    <div className="stack">
      <div className="card nao-imprimir stack">
        <div className="row between" style={{ alignItems: "start" }}>
          <div style={{ flex: 1, minWidth: 240 }}>
            <p className="muted small" style={{ margin: 0 }}>Currículo personalizado para</p>
            <h1 style={{ margin: "2px 0" }}>{vaga.titulo}</h1>
            <div className="muted">{vaga.empresa} · {vaga.local} · vaga em {NOME_IDIOMA[idiomaVaga]?.toLowerCase() || idiomaVaga}</div>
          </div>
          <div className="row">
            <a className="btn sec" href={vaga.url} target="_blank" rel="noopener noreferrer">Ver vaga ↗</a>
            <button className="btn" disabled={!ajuste || traduzindo} onClick={() => window.print()}>Imprimir / PDF</button>
          </div>
        </div>

        {!perfilCompleto(perfil) && (
          <div className="alerta">Preencha <Link href="/perfil">seu perfil</Link> (nome e competências ou experiências) antes de gerar o currículo.</div>
        )}
        {erro && <div className="alerta">{erro}</div>}

        {ajuste && (
          <div className="item row">
            <div style={{ flex: 1, minWidth: 220 }}>
              <strong className="small">Idioma do currículo</strong>
              {idiomaVaga !== "pt" && !traducao && (
                <p className="small" style={{ margin: "2px 0 0", color: "var(--warn)" }}>
                  A vaga está em {NOME_IDIOMA[idiomaVaga]?.toLowerCase()}: recomendamos enviar o currículo no mesmo idioma.
                </p>
              )}
              {traducao && <p className="muted small" style={{ margin: "2px 0 0" }}>Traduzido para {NOME_IDIOMA[traducao.idioma]?.toLowerCase()} ({traducao.motor}). Revise antes de enviar.</p>}
            </div>
            <select style={{ width: "auto" }} value={idiomaAlvo} onChange={(e) => setIdiomaAlvo(e.target.value)} disabled={!!traduzindo}>
              {IDIOMAS_CV.map((i) => <option key={i.id} value={i.id}>{i.nome}{i.id === idiomaVaga ? " (idioma da vaga)" : ""}</option>)}
            </select>
            <button className="btn sec" disabled={!!traduzindo || (traducao?.idioma || "pt") === idiomaAlvo} onClick={traduzir}>
              {traduzindo || (idiomaAlvo === "pt" ? "Voltar ao português" : "Traduzir currículo")}
            </button>
          </div>
        )}

        {ajuste && (
          <div className="grid-2">
            <div>
              <div className="row between small"><strong>Compatibilidade estimada</strong><span>{ajuste.compatibilidade}%</span></div>
              <div className="barra" style={{ marginTop: 6 }}><div style={{ width: `${ajuste.compatibilidade}%` }} /></div>
              <p className="muted small" style={{ marginTop: 8 }}>
                Título, resumo, competências e tópicos ajustados ao que a vaga pede, considerando a relação entre skills (ex.: PostgreSQL atende SQL). Palavras-chave em negrito. Recalculado sempre que você abre a vaga. {salvo && "Salvo na sua conta."}
              </p>
              {ajuste.atendidos?.length > 0 && (
                <>
                  <strong className="small">Você atende</strong>
                  <div className="tags" style={{ marginTop: 6 }}>{ajuste.atendidos.map((d) => <span key={d} className="tag ok">{d}</span>)}</div>
                </>
              )}
            </div>
            <div>
              {ajuste.relacionados?.length > 0 && (
                <>
                  <strong className="small">Você tem algo parecido</strong>
                  <div className="tags" style={{ margin: "6px 0 12px" }}>{ajuste.relacionados.map((d) => <span key={d} className="tag pri">{d}</span>)}</div>
                </>
              )}
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

      {ajuste && (
        <CurriculoEditavel
          key={exibido.idioma}
          // Cada idioma tem a sua edição: a feita em português não aparece na versão em inglês.
          htmlSalvo={edicao?.idioma === exibido.idioma ? edicao.html : null}
          onSalvar={(html) => {
            const ed = { html, idioma: exibido.idioma, em: new Date().toISOString() };
            setEdicao(ed);
            return salvar(vaga, ajuste, traducao, ed);
          }}
          onDescartar={() => {
            setEdicao(null);
            salvar(vaga, ajuste, traducao, null);
          }}
        >
          <Curriculo perfil={exibido.perfil} ajuste={exibido.ajuste} idioma={exibido.idioma} />
        </CurriculoEditavel>
      )}
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
