"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AREAS, MODALIDADES, NIVEIS } from "@/shared/vagas";
import { tempoRelativo } from "@/shared/texto";
import { IDIOMAS_CV } from "@/shared/traducao";
import { personalizar } from "@/shared/personalizar";
import { perfilCompleto } from "@/shared/perfil";
import { buscarVagas, carregarCurriculos, carregarFavoritos, carregarPerfil, desfavoritar, favoritar } from "@/frontend/lib/api";
import { guardarVagaAtual } from "@/frontend/lib/navegacao";
import SeletorLocal from "@/frontend/components/SeletorLocal";
import ResumoBusca from "@/frontend/components/ResumoBusca";
import { useProtegido } from "@/frontend/hooks/useProtegido";

// Raio a partir da cidade escolhida. Vagas remotas aparecem sempre, independente do local.
const RAIOS = [[0, "Só a cidade"], [25, "Até 25 km"], [50, "Até 50 km"], [90, "Até 90 km"], [150, "Até 150 km"], [300, "Até 300 km"]];

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

// Versão no nome da chave: buscas salvas por versões antigas (com regras de filtro antigas) são ignoradas.
const CHAVE_BUSCA = "ca:busca:v3";

const faixa = (p) => (p >= 70 ? "alta" : p >= 40 ? "media" : "baixa");

async function carregar() {
  const [perfil, curriculos, favoritos] = await Promise.all([carregarPerfil(), carregarCurriculos(), carregarFavoritos()]);
  return { perfil, curriculos, favoritos };
}

// Avalia as vagas aos poucos (lotes pequenos) para a tela não travar com 200 vagas.
// Nada vai para o servidor: a compatibilidade é calculada no navegador e não é salva.
function useAvaliacoes(lista, perfil) {
  const [avaliacoes, setAvaliacoes] = useState(() => new Map());
  useEffect(() => {
    if (!perfil || !perfilCompleto(perfil) || !lista.length) return;
    let cancelado = false;
    const pendentes = lista.filter((v) => !avaliacoes.has(v.id));
    let i = 0;
    function lote() {
      if (cancelado) return;
      const novos = new Map();
      for (const v of pendentes.slice(i, i + 12)) novos.set(v.id, personalizar(perfil, v));
      i += 12;
      if (novos.size) setAvaliacoes((m) => new Map([...m, ...novos]));
      if (i < pendentes.length) setTimeout(lote, 0);
    }
    lote();
    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lista, perfil]);
  return avaliacoes;
}

function Detalhes({ avaliacao }) {
  if (!avaliacao) return <p className="muted small">Calculando compatibilidade…</p>;
  const grupo = (titulo, itens, classe) =>
    itens?.length > 0 && (
      <div>
        <strong className="small">{titulo}</strong>
        <div className="tags" style={{ marginTop: 6 }}>{itens.map((t) => <span key={t} className={`tag ${classe}`}>{t}</span>)}</div>
      </div>
    );
  return (
    <div className="stack">
      <div>
        <div className="row between small"><strong>Compatibilidade estimada</strong><span>{avaliacao.compatibilidade}%</span></div>
        <div className="barra" style={{ marginTop: 6 }}><div style={{ width: `${avaliacao.compatibilidade}%` }} /></div>
      </div>
      <div className="grid-2">
        {grupo("Você atende", avaliacao.atendidos, "ok")}
        {grupo("Você tem algo parecido", avaliacao.relacionados, "pri")}
        {grupo("A vaga pede, mas não aparece no seu perfil", avaliacao.lacunas, "warn")}
      </div>
      {avaliacao.dicas?.length > 0 && (
        <div>
          <strong className="small">Dicas</strong>
          <ul className="small" style={{ margin: "4px 0 0", paddingLeft: 18 }}>{avaliacao.dicas.slice(0, 3).map((d) => <li key={d}>{d}</li>)}</ul>
        </div>
      )}
    </div>
  );
}

export default function Vagas() {
  const router = useRouter();
  const [q, setQ] = useState("");
  // Local: estado + cidade de listas fixas, e raio em km a partir da cidade.
  const [local, setLocal] = useState({ uf: "", cidade: "" });
  const [raio, setRaio] = useState(0);
  const [dias, setDias] = useState(0);
  const [modalidades, setModalidades] = useState([]);
  const [niveis, setNiveis] = useState([]);
  const [areas, setAreas] = useState([]);
  const [salMin, setSalMin] = useState("");
  const [salMax, setSalMax] = useState("");
  const [semSalario, setSemSalario] = useState(true);
  const [vagas, setVagas] = useState(null);
  const [fontes, setFontes] = useState([]);
  const [termosArea, setTermosArea] = useState([]); // termos usados numa busca só por área
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [aba, setAba] = useState("busca"); // "busca" | "favoritas"
  const [ordem, setOrdem] = useState("compatibilidade");
  const [aberta, setAberta] = useState(null);
  const [filtrosAbertos, setFiltrosAbertos] = useState(false); // só no celular
  const [favoritas, setFavoritas] = useState(null); // Map id -> vaga
  const { dados } = useProtegido(carregar);
  const perfil = dados?.perfil;
  const geradas = useMemo(() => new Set((dados?.curriculos || []).map((c) => c.vaga.id)), [dados]);

  useEffect(() => {
    if (dados) setFavoritas(new Map(dados.favoritos.map((f) => [f.vaga.id, f.vaga])));
  }, [dados]);

  // Áreas da última busca feita só por área (sem palavra-chave), para não repetir a mesma busca.
  const areasBuscadas = useRef("");

  useEffect(() => {
    try {
      const ultima = JSON.parse(sessionStorage.getItem(CHAVE_BUSCA) || "null");
      if (ultima) {
        setQ(ultima.q); setLocal(ultima.local || { uf: "", cidade: "" }); setRaio(ultima.raio || 0); setDias(ultima.dias);
        setVagas(ultima.vagas); setFontes(ultima.fontes); setTermosArea(ultima.termosArea || []);
        if (!ultima.q && ultima.areas?.length) {
          areasBuscadas.current = [...ultima.areas].sort().join(",");
          setAreas(ultima.areas);
        }
      }
    } catch { /* sem busca anterior */ }
  }, []);

  async function buscar(e) {
    e?.preventDefault();
    const porArea = !q.trim();
    if (porArea && !areas.length) return;
    setCarregando(true);
    setErro("");
    setAba("busca");
    setAberta(null);
    try {
      // Com palavra-chave, os filtros de modalidade/nível/área são aplicados na tela (trocar sem nova busca).
      // Sem palavra-chave, as áreas marcadas viram a própria busca.
      const data = await buscarVagas({ q, uf: local.uf, cidade: local.cidade, raio: local.cidade ? String(raio) : "", dias: String(dias), area: porArea ? areas : [] });
      areasBuscadas.current = porArea ? [...areas].sort().join(",") : "";
      setVagas(data.vagas);
      setFontes(data.fontes);
      setTermosArea(data.termos || []);
      try {
        sessionStorage.setItem(CHAVE_BUSCA, JSON.stringify({ q, local, raio, dias, areas: porArea ? areas : [], termosArea: data.termos || [], vagas: data.vagas, fontes: data.fontes }));
      } catch { /* cota cheia */ }
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  }

  // Sem palavra-chave: marcar (ou desmarcar) uma área já busca, depois de uma pausa curta
  // para dar tempo de marcar mais de uma.
  useEffect(() => {
    if (q.trim()) return;
    const chave = [...areas].sort().join(",");
    if (chave === areasBuscadas.current) return;
    if (!areas.length) {
      if (areasBuscadas.current) { setVagas(null); setFontes([]); setTermosArea([]); areasBuscadas.current = ""; }
      return;
    }
    const t = setTimeout(() => buscar(), 700);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [areas]);

  async function alternarFavorita(vaga) {
    const era = favoritas.has(vaga.id);
    // Atualiza a tela na hora e desfaz se o servidor recusar.
    setFavoritas((m) => {
      const n = new Map(m);
      era ? n.delete(vaga.id) : n.set(vaga.id, vaga);
      return n;
    });
    try {
      await (era ? desfavoritar(vaga.id) : favoritar(vaga));
    } catch (e) {
      setErro(e.message);
      setFavoritas((m) => {
        const n = new Map(m);
        era ? n.set(vaga.id, vaga) : n.delete(vaga.id);
        return n;
      });
    }
  }

  const base = useMemo(
    () => (aba === "favoritas" ? [...(favoritas?.values() || [])] : vagas || []),
    [aba, favoritas, vagas]
  );
  const avaliacoes = useAvaliacoes(base, perfil);

  // Uma vaga passa nos filtros? `ignorar` deixa de fora um grupo: é assim que cada grupo conta as vagas
  // considerando o que está marcado nos OUTROS grupos (ex.: "Remoto (12)" já respeita o nível escolhido).
  const filtroSalario = useMemo(() => {
    const min = Number(salMin) || 0;
    const max = Number(salMax) || Infinity;
    return (v) => {
      if (v.salarioMin == null) return semSalario;
      return v.salarioMax >= min && v.salarioMin <= max; // faixas que se sobrepõem
    };
  }, [salMin, salMax, semSalario]);

  const passa = (v, ignorar) =>
    (ignorar === "modalidade" || !modalidades.length || modalidades.includes(v.modalidade)) &&
    (ignorar === "nivel" || !niveis.length || niveis.includes(v.nivel)) &&
    (ignorar === "area" || !areas.length || areas.includes(v.area)) &&
    (ignorar === "salario" || filtroSalario(v));

  const filtradas = useMemo(() => {
    const lista = base.filter((v) => passa(v));
    if (ordem === "compatibilidade") {
      lista.sort((a, b) => (avaliacoes.get(b.id)?.compatibilidade ?? -1) - (avaliacoes.get(a.id)?.compatibilidade ?? -1));
    }
    return lista;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [base, modalidades, niveis, areas, filtroSalario, ordem, avaliacoes]);

  const contagem = (campo, id) => base.filter((v) => passa(v, campo) && v[campo] === id).length;
  const comSalario = base.filter((v) => passa(v, "salario") && v.salarioMin != null).length;
  const algumFiltro = modalidades.length || niveis.length || areas.length || salMin || salMax || !semSalario;
  const perfilOk = perfil && perfilCompleto(perfil);

  function gerar(vaga) {
    guardarVagaAtual(vaga);
    router.push(`/personalizar?vaga=${encodeURIComponent(vaga.id)}`);
  }

  return (
    <div className="stack">
      <div>
        <h1>Buscar vagas</h1>
        <p className="muted" style={{ margin: 0 }}>Digite palavras-chave ou só marque uma área nos filtros. Veja a compatibilidade de cada vaga, clique para ver os detalhes e gere o currículo só das que interessarem.</p>
      </div>

      <form className="card row" onSubmit={buscar}>
        <div style={{ flex: 3, minWidth: 220 }}>
          <label htmlFor="q">Palavras-chave</label>
          <input id="q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ex.: analista de dados, react — ou deixe vazio e marque uma área" />
        </div>
        <div style={{ flex: 3, minWidth: 260 }}>
          <SeletorLocal uf={local.uf} cidade={local.cidade} onChange={setLocal} />
        </div>
        <div style={{ flex: 1, minWidth: 130 }}>
          <label htmlFor="raio">Raio</label>
          <select id="raio" value={raio} onChange={(e) => setRaio(Number(e.target.value))} disabled={!local.cidade} title={local.cidade ? "" : "Escolha uma cidade para usar o raio"}>
            {RAIOS.map(([v, n]) => <option key={v} value={v}>{n}</option>)}
          </select>
        </div>
        <div style={{ flex: 1, minWidth: 150 }}>
          <label htmlFor="dias">Publicada em</label>
          <select id="dias" value={dias} onChange={(e) => setDias(Number(e.target.value))}>
            {PERIODOS.map(([v, n]) => <option key={v} value={v}>{n}</option>)}
          </select>
        </div>
        <button className="btn" style={{ alignSelf: "end" }} disabled={carregando || (!q.trim() && !areas.length)}>
          {carregando ? "Buscando…" : "Buscar"}
        </button>
      </form>

      {erro && <div className="alerta">{erro}</div>}
      {dados && !perfilOk && (
        <div className="alerta info">Preencha <Link href="/perfil">seu perfil</Link> (nome e competências ou experiências) para ver a compatibilidade de cada vaga.</div>
      )}

      <div className="busca-layout">
        <aside className={`card filtros ${filtrosAbertos ? "aberto" : ""}`}>
          <button type="button" className="btn sec filtros-alternar" onClick={() => setFiltrosAbertos(!filtrosAbertos)} aria-expanded={filtrosAbertos}>
            Filtros{algumFiltro ? " (ativos)" : ""} {filtrosAbertos ? "▲" : "▼"}
          </button>
          <div className="filtros-corpo">
          <fieldset>
            <legend>Modalidade</legend>
            {MODALIDADES.map((m) => (
              <label key={m.id} className="check">
                <input type="checkbox" checked={modalidades.includes(m.id)} onChange={() => setModalidades(alternar(modalidades, m.id))} />
                {m.nome} <span className="muted small">({contagem("modalidade", m.id)})</span>
              </label>
            ))}
          </fieldset>
          <fieldset>
            <legend>Nível do cargo</legend>
            {[...NIVEIS.map((n) => n.id), "nao_informado"].map((id) => (
              <label key={id} className="check">
                <input type="checkbox" checked={niveis.includes(id)} onChange={() => setNiveis(alternar(niveis, id))} />
                {NIVEL_NOME[id]} <span className="muted small">({contagem("nivel", id)})</span>
              </label>
            ))}
          </fieldset>
          <fieldset>
            <legend>Área</legend>
            {[...AREAS.map((a) => a.id), "outros"].map((id) => (
              <label key={id} className="check">
                <input type="checkbox" checked={areas.includes(id)} onChange={() => setAreas(alternar(areas, id))} />
                {AREA_NOME[id]} <span className="muted small">({contagem("area", id)})</span>
              </label>
            ))}
          </fieldset>
          <fieldset>
            <legend>Faixa salarial (R$/mês)</legend>
            <div className="grid-2" style={{ gap: 6 }}>
              <input type="number" inputMode="numeric" min="0" step="500" placeholder="Mínimo" aria-label="Salário mínimo" value={salMin} onChange={(e) => setSalMin(e.target.value)} />
              <input type="number" inputMode="numeric" min="0" step="500" placeholder="Máximo" aria-label="Salário máximo" value={salMax} onChange={(e) => setSalMax(e.target.value)} />
            </div>
            <label className="check" style={{ marginTop: 8 }}>
              <input type="checkbox" checked={semSalario} onChange={(e) => setSemSalario(e.target.checked)} />
              Incluir vagas sem salário informado
            </label>
            <p className="muted small" style={{ margin: "4px 0 0" }}>{comSalario} vaga(s) informam salário.</p>
          </fieldset>
          {algumFiltro ? (
            <button className="btn sec sm" onClick={() => { setModalidades([]); setNiveis([]); setAreas([]); setSalMin(""); setSalMax(""); setSemSalario(true); }}>Limpar filtros</button>
          ) : null}
          </div>
        </aside>

        <section>
          <div className="row between" style={{ marginBottom: 12 }}>
            <div className="abas" role="tablist">
              <button role="tab" aria-selected={aba === "busca"} className={aba === "busca" ? "ativa" : ""} onClick={() => { setAba("busca"); setAberta(null); }}>
                Resultados{vagas ? ` (${vagas.length})` : ""}
              </button>
              <button role="tab" aria-selected={aba === "favoritas"} className={aba === "favoritas" ? "ativa" : ""} onClick={() => { setAba("favoritas"); setAberta(null); }}>
                ★ Favoritas{favoritas ? ` (${favoritas.size})` : ""}
              </button>
            </div>
            <label className="row small" style={{ gap: 6 }}>
              Ordenar por
              <select value={ordem} onChange={(e) => setOrdem(e.target.value)} style={{ width: "auto" }}>
                <option value="compatibilidade">Maior compatibilidade</option>
                <option value="recentes">Mais recentes</option>
              </select>
            </label>
          </div>

          {aba === "busca" && vagas === null && !carregando && <div className="card vazio">Digite palavras-chave e clique em Buscar, ou só marque uma área nos filtros.</div>}
          {aba === "busca" && termosArea.length > 0 && !carregando && (
            <p className="muted small" style={{ margin: "0 0 10px" }}>Busca pela área, usando os termos: {termosArea.join(", ")}.</p>
          )}
          {aba === "busca" && carregando && <div className="card vazio">Buscando vagas em várias fontes…</div>}
          {aba === "favoritas" && favoritas?.size === 0 && <div className="card vazio">Nenhuma vaga favorita. Clique na ☆ de uma vaga para guardá-la aqui.</div>}

          {aba === "busca" && vagas && !carregando && (
            <div className="row between small" style={{ marginBottom: 12 }}>
              <strong>{filtradas.length === vagas.length ? `${vagas.length} vaga(s)` : `${filtradas.length} de ${vagas.length} vagas (com os filtros)`}</strong>
              <div className="tags">
                {fontes.map((f) => (
                  <span key={f.nome} className={`tag ${f.ok ? "ok" : "warn"}`} title={f.detalhe || ""}>
                    {f.nome}: {f.ok ? f.total : f.detalhe}
                  </span>
                ))}
              </div>
            </div>
          )}

          {perfilOk && !(aba === "busca" && carregando) && filtradas.length > 0 && (
            <ResumoBusca vagas={filtradas} avaliacoes={avaliacoes} />
          )}

          {!(aba === "busca" && carregando) && filtradas.map((v) => {
            const av = avaliacoes.get(v.id);
            const estaAberta = aberta === v.id;
            const fav = favoritas?.has(v.id);
            return (
              <article key={v.id} className={`item vaga ${estaAberta ? "aberta" : ""}`}>
                <div className="row" style={{ alignItems: "start", flexWrap: "nowrap" }}>
                  {perfilOk && (
                    <div className={`compat ${av ? faixa(av.compatibilidade) : ""}`} title="Compatibilidade com o seu perfil">
                      {av ? `${av.compatibilidade}%` : "…"}
                    </div>
                  )}
                  <button className="vaga-cabecalho" aria-expanded={estaAberta} onClick={() => setAberta(estaAberta ? null : v.id)}>
                    <h3>{v.titulo}</h3>
                    <div className="muted small">{v.empresa} · {v.local}{v.distanciaKm != null && v.modalidade !== "remoto" ? ` (${v.distanciaKm} km)` : ""} · {tempoRelativo(v.publicadaEm)} · via {v.fonte}</div>
                  </button>
                  <button className={`estrela ${fav ? "ativa" : ""}`} onClick={() => alternarFavorita(v)} aria-pressed={!!fav} title={fav ? "Remover das favoritas" : "Favoritar vaga"}>
                    {fav ? "★" : "☆"}
                  </button>
                </div>
                <div className="tags" style={{ marginTop: 8 }}>
                  <span className="tag pri">{MOD_NOME[v.modalidade]}</span>
                  <span className="tag">{NIVEL_NOME[v.nivel]}</span>
                  <span className="tag">{AREA_NOME[v.area]}</span>
                  {v.idioma && v.idioma !== "pt" && <span className="tag warn">Vaga em {IDIOMA_NOME[v.idioma]?.toLowerCase()}</span>}
                  {v.salario && <span className="tag ok">{v.salario}</span>}
                  {geradas.has(v.id) && <span className="tag ok">Currículo gerado</span>}
                </div>

                {estaAberta ? (
                  <div className="stack vaga-detalhe">
                    {perfilOk && <Detalhes avaliacao={av} />}
                    <div>
                      <strong className="small">Descrição da vaga</strong>
                      <div className="descricao-completa small">{v.descricao}</div>
                    </div>
                    <div className="row">
                      <button className="btn sm" onClick={() => gerar(v)} disabled={!perfilOk}>{geradas.has(v.id) ? "Ver currículo" : "Gerar currículo para esta vaga"}</button>
                      <a className="btn sec sm" href={v.url} target="_blank" rel="noopener noreferrer">Ver vaga original ↗</a>
                    </div>
                  </div>
                ) : (
                  <p className="desc">{v.descricao}</p>
                )}
              </article>
            );
          })}
        </section>
      </div>
    </div>
  );
}
