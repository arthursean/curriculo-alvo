"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AREAS, MODALIDADES, NIVEIS } from "@/shared/vagas";
import { tempoRelativo } from "@/shared/texto";
import { IDIOMAS_CV } from "@/shared/traducao";
import { buscarVagas, carregarCurriculos } from "@/frontend/lib/api";
import { guardarVagaAtual } from "@/frontend/lib/navegacao";
import { useProtegido } from "@/frontend/hooks/useProtegido";

const PERIODOS = [
  [0, "Qualquer data"],
  [1, "Últimas 24 horas"],
  [3, "Últimos 3 dias"],
  [7, "Última semana"],
  [15, "Últimos 15 dias"],
  [30, "Último mês"],
];
const NIVEL_NOME = Object.fromEntries([...NIVEIS.map((n) => [n.id, n.nome]), ["nao_informado", "Nível não informado"]]);
const AREA_NOME = Object.fromEntries([...AREAS.map((a) => [a.id, a.nome]), ["outros", "Outras áreas"]]);
const MOD_NOME = Object.fromEntries(MODALIDADES.map((m) => [m.id, m.nome]));
const IDIOMA_NOME = Object.fromEntries(IDIOMAS_CV.map((i) => [i.id, i.nome]));

function alternar(lista, valor) {
  return lista.includes(valor) ? lista.filter((v) => v !== valor) : [...lista, valor];
}

export default function Vagas() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [local, setLocal] = useState("");
  const [dias, setDias] = useState(0);
  const [modalidades, setModalidades] = useState([]);
  const [niveis, setNiveis] = useState([]);
  const [areas, setAreas] = useState([]);
  const [vagas, setVagas] = useState(null);
  const [fontes, setFontes] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const { dados: curriculos } = useProtegido(carregarCurriculos);
  const geradas = useMemo(() => new Set((curriculos || []).map((c) => c.vaga.id)), [curriculos]);

  useEffect(() => {
    try {
      const ultima = JSON.parse(sessionStorage.getItem("ca:busca") || "null");
      if (ultima) {
        setQ(ultima.q); setLocal(ultima.local); setDias(ultima.dias);
        setVagas(ultima.vagas); setFontes(ultima.fontes);
      }
    } catch { /* sem busca anterior */ }
  }, []);

  async function buscar(e) {
    e?.preventDefault();
    if (!q.trim()) return;
    setCarregando(true);
    setErro("");
    try {
      // Os filtros de modalidade/nível/área são aplicados na tela, para trocar sem nova busca.
      const data = await buscarVagas({ q, local, dias: String(dias) });
      setVagas(data.vagas);
      setFontes(data.fontes);
      try {
        sessionStorage.setItem("ca:busca", JSON.stringify({ q, local, dias, vagas: data.vagas, fontes: data.fontes }));
      } catch { /* cota cheia */ }
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  }

  const filtradas = useMemo(
    () =>
      (vagas || []).filter(
        (v) =>
          (!modalidades.length || modalidades.includes(v.modalidade)) &&
          (!niveis.length || niveis.includes(v.nivel)) &&
          (!areas.length || areas.includes(v.area))
      ),
    [vagas, modalidades, niveis, areas]
  );

  const contagem = (campo, id) => (vagas || []).filter((v) => v[campo] === id).length;

  function gerar(vaga) {
    guardarVagaAtual(vaga);
    router.push(`/personalizar?vaga=${encodeURIComponent(vaga.id)}`);
  }

  return (
    <div className="stack">
      <div>
        <h1>Buscar vagas</h1>
        <p className="muted" style={{ margin: 0 }}>Digite cargos, ferramentas ou palavras-chave. Depois escolha uma vaga para gerar o currículo personalizado.</p>
      </div>

      <form className="card row" onSubmit={buscar}>
        <div style={{ flex: 3, minWidth: 220 }}>
          <label htmlFor="q">Palavras-chave</label>
          <input id="q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ex.: analista de dados, react, marketing digital" />
        </div>
        <div style={{ flex: 2, minWidth: 160 }}>
          <label htmlFor="local">Cidade / estado (opcional)</label>
          <input id="local" value={local} onChange={(e) => setLocal(e.target.value)} placeholder="São Paulo" />
        </div>
        <div style={{ flex: 1, minWidth: 150 }}>
          <label htmlFor="dias">Publicada em</label>
          <select id="dias" value={dias} onChange={(e) => setDias(Number(e.target.value))}>
            {PERIODOS.map(([v, n]) => <option key={v} value={v}>{n}</option>)}
          </select>
        </div>
        <button className="btn" style={{ alignSelf: "end" }} disabled={carregando || !q.trim()}>
          {carregando ? "Buscando…" : "Buscar"}
        </button>
      </form>

      {erro && <div className="alerta">{erro}</div>}

      <div className="busca-layout">
        <aside className="card filtros">
          <fieldset>
            <legend>Modalidade</legend>
            {MODALIDADES.map((m) => (
              <label key={m.id} className="check">
                <input type="checkbox" checked={modalidades.includes(m.id)} onChange={() => setModalidades(alternar(modalidades, m.id))} />
                {m.nome} {vagas && <span className="muted small">({contagem("modalidade", m.id)})</span>}
              </label>
            ))}
          </fieldset>
          <fieldset>
            <legend>Nível do cargo</legend>
            {[...NIVEIS.map((n) => n.id), "nao_informado"].map((id) => (
              <label key={id} className="check">
                <input type="checkbox" checked={niveis.includes(id)} onChange={() => setNiveis(alternar(niveis, id))} />
                {NIVEL_NOME[id]} {vagas && <span className="muted small">({contagem("nivel", id)})</span>}
              </label>
            ))}
          </fieldset>
          <fieldset>
            <legend>Área</legend>
            {[...AREAS.map((a) => a.id), "outros"].map((id) => (
              <label key={id} className="check">
                <input type="checkbox" checked={areas.includes(id)} onChange={() => setAreas(alternar(areas, id))} />
                {AREA_NOME[id]} {vagas && <span className="muted small">({contagem("area", id)})</span>}
              </label>
            ))}
          </fieldset>
          {(modalidades.length || niveis.length || areas.length) > 0 && (
            <button className="btn sec sm" onClick={() => { setModalidades([]); setNiveis([]); setAreas([]); }}>Limpar filtros</button>
          )}
        </aside>

        <section>
          {vagas === null && !carregando && <div className="card vazio">Faça uma busca para ver as vagas.</div>}
          {carregando && <div className="card vazio">Buscando vagas em várias fontes…</div>}
          {vagas && !carregando && (
            <>
              <div className="row between" style={{ marginBottom: 12 }}>
                <strong>{filtradas.length} vaga(s)</strong>
                <div className="tags">
                  {fontes.map((f) => (
                    <span key={f.nome} className={`tag ${f.ok ? "ok" : "warn"}`} title={f.detalhe || ""}>
                      {f.nome}: {f.ok ? f.total : f.detalhe}
                    </span>
                  ))}
                </div>
              </div>
              {filtradas.length === 0 && <div className="card vazio">Nenhuma vaga com esses filtros. Tente outras palavras ou remova filtros.</div>}
              {filtradas.map((v) => (
                <article key={v.id} className="item vaga">
                  <div className="row between" style={{ alignItems: "start" }}>
                    <div style={{ flex: 1, minWidth: 220 }}>
                      <h3>{v.titulo}</h3>
                      <div className="muted small">{v.empresa} · {v.local} · {tempoRelativo(v.publicadaEm)} · via {v.fonte}</div>
                    </div>
                    {geradas.has(v.id) && <span className="tag ok">Currículo gerado</span>}
                  </div>
                  <div className="tags" style={{ marginTop: 8 }}>
                    <span className="tag pri">{MOD_NOME[v.modalidade]}</span>
                    <span className="tag">{NIVEL_NOME[v.nivel]}</span>
                    <span className="tag">{AREA_NOME[v.area]}</span>
                    {v.idioma && v.idioma !== "pt" && <span className="tag warn">Vaga em {IDIOMA_NOME[v.idioma]?.toLowerCase()}</span>}
                    {v.salario && <span className="tag ok">{v.salario}</span>}
                  </div>
                  <p className="desc">{v.descricao}</p>
                  <div className="row">
                    <button className="btn sm" onClick={() => gerar(v)}>{geradas.has(v.id) ? "Ver currículo" : "Gerar currículo para esta vaga"}</button>
                    <a className="btn sec sm" href={v.url} target="_blank" rel="noopener noreferrer">Ver vaga original ↗</a>
                  </div>
                </article>
              ))}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
