"use client";
import Link from "next/link";
import { carregarPainel } from "@/frontend/lib/api";
import { useProtegido } from "@/frontend/hooks/useProtegido";
import BotaoEnviada, { useCandidaturas } from "@/frontend/components/BotaoEnviada";
import { tempoRelativo } from "@/shared/texto";

const ehLink = (u) => /^https?:\/\//i.test(u || "");

function Numero({ valor, rotulo, detalhe }) {
  return (
    <div className="card numero">
      <span className="numero-valor">{valor}</span>
      <span className="numero-rotulo">{rotulo}</span>
      {detalhe && <span className="muted small">{detalhe}</span>}
    </div>
  );
}

export default function Inicio() {
  const { dados: p, erro, recarregar } = useProtegido(carregarPainel);
  const { enviadas, alternar: alternarEnviada, carregado } = useCandidaturas();
  // Depois de marcar, atualiza a compatibilidade média e os totais.
  const alternar = (vaga, compat) => alternarEnviada(vaga, compat).then(recarregar);
  if (erro) return <div className="alerta">{erro}</div>;
  if (!p) return <div className="vazio">Carregando…</div>;

  const primeiroNome = (p.perfil.nome || "").split(" ")[0];
  const faltam = p.perfil.checklist.filter((c) => !c.ok);
  const { media, vagas } = p.compatibilidade;
  // Vagas visitadas que ainda não foram marcadas como enviadas: o lembrete mais útil.
  const pendentes = p.ultimosLinks.filter((l) => !enviadas.has(l.vagaId));
  // Lista e total vêm do estado da tela (atualiza na hora ao marcar); antes de carregar, do servidor.
  const listaEnviadas = carregado
    ? [...enviadas.values()].sort((a, b) => new Date(b.enviadaEm) - new Date(a.enviadaEm)).slice(0, 6)
      .map((c) => ({ vagaId: c.vaga.id, titulo: c.vaga.titulo, empresa: c.vaga.empresa, url: c.vaga.url, compat: c.compatibilidade, em: c.enviadaEm }))
    : p.candidaturas.recentes;
  const totalEnviadas = carregado ? enviadas.size : p.candidaturas.total;

  return (
    <div className="stack painel">
      <div className="row between">
        <div>
          <h1>{primeiroNome ? `Olá, ${primeiroNome}` : "Início"}</h1>
          <p className="muted" style={{ margin: 0 }}>Suas candidaturas e currículos.</p>
        </div>
        <Link href="/vagas" className="btn">Buscar vagas</Link>
      </div>

      <div className="numeros">
        <Numero valor={totalEnviadas} rotulo="Candidaturas enviadas" detalhe={p.candidaturas.ultimos30 ? `${p.candidaturas.ultimos30} nos últimos 30 dias` : null} />
        <Numero valor={p.curriculos.total} rotulo="Currículos gerados" detalhe={p.curriculos.ultimos30 ? `${p.curriculos.ultimos30} nos últimos 30 dias` : null} />
        <Numero
          valor={media != null ? `${media}%` : "—"}
          rotulo="Compatibilidade média"
          detalhe={media != null ? (vagas === 1 ? "da vaga com currículo ou candidatura" : `das ${vagas} vagas com currículo ou candidatura`) : "gere um currículo ou marque uma candidatura"}
        />
      </div>

      {faltam.length > 0 && (
        <div className="card perfil-faltando">
          <div style={{ flex: 1, minWidth: 220 }}>
            <strong>Perfil {p.perfil.completo}% completo</strong>
            <div className="barra" style={{ margin: "8px 0" }}><div style={{ width: `${p.perfil.completo}%` }} /></div>
            <span className="muted small">Falta: {faltam.map((c) => c.nome.toLowerCase()).join(", ")}.</span>
          </div>
          <Link href="/perfil" className="btn sec sm">Completar perfil</Link>
        </div>
      )}

      <div className="painel-grade">
        <section className="card stack">
          <h2 style={{ margin: 0 }}>Candidaturas enviadas</h2>
          {listaEnviadas.length === 0 ? (
            <p className="muted small" style={{ margin: 0 }}>Quando se candidatar a uma vaga, clique em “Marcar como enviada” para acompanhar aqui.</p>
          ) : (
            <ul className="lista-painel">
              {listaEnviadas.map((c) => (
                <li key={c.vagaId}>
                  {ehLink(c.url) ? <a href={c.url} target="_blank" rel="noopener noreferrer">{c.titulo} ↗</a> : <span>{c.titulo}</span>}
                  <span className="muted small">{[c.empresa, `enviada ${tempoRelativo(c.em)}`].filter(Boolean).join(" · ")}</span>
                  {c.compat != null && <span className="tag pri">{c.compat}%</span>}
                </li>
              ))}
            </ul>
          )}
        </section>

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
                  {enviadas.has(c.vagaId) && <span className="tag ok">enviada</span>}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {pendentes.length > 0 && (
        <section className="card stack">
          <div>
            <h2 style={{ margin: 0 }}>Você se candidatou?</h2>
            <p className="muted small" style={{ margin: "2px 0 0" }}>Vagas que você abriu no site original e ainda não marcou como enviadas.</p>
          </div>
          <ul className="lista-painel">
            {pendentes.map((l) => (
              <li key={l.vagaId}>
                {ehLink(l.url) ? <a href={l.url} target="_blank" rel="noopener noreferrer">{l.titulo || "Vaga"} ↗</a> : <span>{l.titulo || "Vaga"}</span>}
                <span className="muted small">{[l.empresa, `aberta ${tempoRelativo(l.em)}`].filter(Boolean).join(" · ")}</span>
                <BotaoEnviada enviada={false} onClick={() => alternar({ id: l.vagaId, titulo: l.titulo, empresa: l.empresa, local: l.local, url: l.url, fonte: l.fonte }, l.compatibilidade)} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
