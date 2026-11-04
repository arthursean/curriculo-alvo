"use client";
import Link from "next/link";
import { carregarPainel } from "@/frontend/lib/api";
import { useProtegido } from "@/frontend/hooks/useProtegido";
import GraficoDiario from "@/frontend/components/GraficoDiario";
import { AREAS } from "@/shared/vagas";
import { tempoRelativo } from "@/shared/texto";

const AREA_NOME = Object.fromEntries(AREAS.map((a) => [a.id, a.nome]));
const pct = (a, b) => (b > 0 ? Math.round((a / b) * 100) : 0);

function Numero({ valor, rotulo, detalhe, destaque }) {
  return (
    <div className={`card numero ${destaque ? "destaque" : ""}`}>
      <span className="numero-valor">{valor}</span>
      <span className="numero-rotulo">{rotulo}</span>
      {detalhe && <span className="muted small">{detalhe}</span>}
    </div>
  );
}

// Do interesse à ação, nos últimos 30 dias. Cada etapa é uma barra proporcional à maior.
function Funil({ etapas }) {
  const max = Math.max(1, ...etapas.map((e) => e.valor));
  return (
    <div className="funil">
      {etapas.map((e, i) => (
        <div key={e.nome} className="funil-etapa">
          <div className="funil-texto">
            <span>{e.nome}</span>
            <strong>{e.valor}</strong>
          </div>
          <div className="funil-trilho"><div className="funil-barra" style={{ width: `${(e.valor / max) * 100}%` }} /></div>
          {e.nota && <span className="muted small">{e.nota}</span>}
        </div>
      ))}
    </div>
  );
}

export default function Inicio() {
  const { dados: p, erro } = useProtegido(carregarPainel);
  if (erro) return <div className="alerta">{erro}</div>;
  if (!p) return <div className="vazio">Carregando…</div>;

  const primeiroNome = (p.perfil.nome || "").split(" ")[0];
  const semAtividade = !p.buscas.total && !p.detalhes.total && !p.curriculos.total;
  const faltam = p.perfil.checklist.filter((c) => !c.ok);

  return (
    <div className="stack painel">
      <div className="row between">
        <div>
          <h1>{primeiroNome ? `Olá, ${primeiroNome}` : "Início"}</h1>
          <p className="muted" style={{ margin: 0 }}>Seu resumo dos últimos 30 dias.</p>
        </div>
        <div className="row">
          <Link href="/vagas" className="btn">Buscar vagas</Link>
          <Link href="/curriculo" className="btn sec">Currículo base</Link>
        </div>
      </div>

      {semAtividade && (
        <div className="alerta info">
          Comece por aqui: complete o <Link href="/perfil">perfil</Link>, <Link href="/vagas">busque vagas</Link> e abra as que interessarem.
          Os números abaixo vão se preenchendo conforme você usa o site.
        </div>
      )}

      <div className="numeros">
        <Numero destaque valor={p.detalhes.vagas30} rotulo="Vagas abertas" detalhe={`descrições vistas · ${p.detalhes.vagas} no total`} />
        <Numero destaque valor={p.links.vagas30} rotulo="Links clicados" detalhe={`vagas vistas no site original · ${p.links.vagas} no total`} />
        <Numero destaque valor={p.curriculos.ultimos30} rotulo="Currículos gerados" detalhe={`${p.curriculos.total} no total`} />
        <Numero valor={p.curriculos.compatMedia != null ? `${p.curriculos.compatMedia}%` : "—"} rotulo="Compatibilidade média" detalhe="dos currículos gerados" />
        <Numero valor={p.buscas.ultimos30} rotulo="Buscas" detalhe={`${p.buscas.total} no total`} />
        <Numero valor={p.pdfs.ultimos30} rotulo="PDFs gerados" detalhe={`${p.curriculos.traduzidos || 0} currículo(s) traduzido(s)`} />
        <Numero valor={p.favoritos.total} rotulo="Vagas favoritas" />
        <Numero valor={`${p.perfil.completo}%`} rotulo="Perfil completo" detalhe={faltam.length ? `falta: ${faltam[0].nome.toLowerCase()}` : "tudo preenchido"} />
      </div>

      <div className="painel-grade">
        <section className="card stack">
          <h2 style={{ margin: 0 }}>Vagas abertas por dia</h2>
          <GraficoDiario serie={p.porDia} rotulo="Vagas abertas" unidade="vaga(s) aberta(s)" />
        </section>

        <section className="card stack">
          <h2 style={{ margin: 0 }}>Da busca ao currículo</h2>
          <Funil etapas={[
            { nome: "Buscas", valor: p.buscas.ultimos30 },
            {
              nome: "Vagas abertas", valor: p.detalhes.vagas30,
              nota: p.buscas.ultimos30 > 0 ? `média de ${(p.detalhes.vagas30 / p.buscas.ultimos30).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} por busca` : null,
            },
            { nome: "Links clicados", valor: p.links.vagas30, nota: p.detalhes.vagas30 > 0 ? `${pct(p.links.vagas30, p.detalhes.vagas30)}% das vagas abertas` : null },
            { nome: "Currículos gerados", valor: p.curriculos.ultimos30, nota: p.detalhes.vagas30 > 0 ? `${pct(p.curriculos.ultimos30, p.detalhes.vagas30)}% das vagas abertas` : null },
          ]} />
        </section>
      </div>

      <div className="painel-grade">
        <section className="card stack">
          <div className="row between">
            <h2 style={{ margin: 0 }}>Últimos currículos</h2>
            <Link href="/meus-curriculos" className="small">Ver todos</Link>
          </div>
          {p.curriculos.recentes.length === 0 ? (
            <p className="muted small" style={{ margin: 0 }}>Nenhum ainda. Abra uma vaga e gere o currículo dela.</p>
          ) : (
            <ul className="lista-painel">
              {p.curriculos.recentes.map((c) => (
                <li key={c.vagaId}>
                  <Link href={`/personalizar?vaga=${encodeURIComponent(c.vagaId)}`}>{c.titulo}</Link>
                  <span className="muted small">{c.empresa} · {tempoRelativo(c.em)}</span>
                  {c.compat != null && <span className="tag pri">{c.compat}%</span>}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card stack">
          <h2 style={{ margin: 0 }}>Vagas que você visitou</h2>
          {p.ultimosLinks.length === 0 ? (
            <p className="muted small" style={{ margin: 0 }}>Quando você clicar em “Ver vaga original”, ela aparece aqui para voltar depois.</p>
          ) : (
            <ul className="lista-painel">
              {p.ultimosLinks.map((l) => (
                <li key={l.vagaId}>
                  {l.url ? <a href={l.url} target="_blank" rel="noopener noreferrer">{l.titulo || "Vaga"} ↗</a> : <span>{l.titulo || "Vaga"}</span>}
                  <span className="muted small">{[l.empresa, l.fonte && `via ${l.fonte}`, tempoRelativo(l.em)].filter(Boolean).join(" · ")}</span>
                  {l.compatibilidade != null && <span className="tag">{l.compatibilidade}%</span>}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="painel-grade">
        <section className="card stack">
          <div className="row between">
            <h2 style={{ margin: 0 }}>Seu perfil</h2>
            <Link href="/perfil" className="small">Editar</Link>
          </div>
          <div className="barra" aria-label={`Perfil ${p.perfil.completo}% completo`}><div style={{ width: `${p.perfil.completo}%` }} /></div>
          <ul className="checklist">
            {p.perfil.checklist.map((c) => (
              <li key={c.nome} className={c.ok ? "ok" : ""}><span aria-hidden>{c.ok ? "✓" : "○"}</span> {c.nome}{!c.ok && <span className="muted small"> — falta</span>}</li>
            ))}
          </ul>
          {faltam.length > 0 && <p className="muted small" style={{ margin: 0 }}>Quanto mais completo o perfil, melhor a compatibilidade calculada e o currículo de cada vaga.</p>}
        </section>

        <section className="card stack">
          <h2 style={{ margin: 0 }}>Seus interesses</h2>
          <div>
            <strong className="small">Áreas das vagas que você abriu</strong>
            {p.areas.length ? (
              <div className="tags" style={{ marginTop: 6 }}>{p.areas.map((a) => <span key={a.area} className="tag">{AREA_NOME[a.area] || a.area} · {a.vagas}</span>)}</div>
            ) : <p className="muted small" style={{ margin: "4px 0 0" }}>Nada ainda.</p>}
          </div>
          <div>
            <strong className="small">O que você mais buscou</strong>
            {p.termos.length ? (
              <div className="tags" style={{ marginTop: 6 }}>{p.termos.map((t) => <span key={t.termo} className="tag">{t.termo} · {t.vezes}×</span>)}</div>
            ) : <p className="muted small" style={{ margin: "4px 0 0" }}>Nada ainda.</p>}
          </div>
          {p.favoritos.recentes.length > 0 && (
            <div>
              <strong className="small">Favoritas recentes</strong>
              <ul className="lista-painel" style={{ marginTop: 6 }}>
                {p.favoritos.recentes.map((f) => (
                  <li key={f.vagaId}>
                    {/^https?:\/\//i.test(f.url || "") ? <a href={f.url} target="_blank" rel="noopener noreferrer">{f.titulo} ↗</a> : <span>{f.titulo}</span>}
                    <span className="muted small">{f.empresa}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
