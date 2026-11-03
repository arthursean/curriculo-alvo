import { ROTULOS } from "@/shared/traducao";

function periodo(inicio, fim, atual, r) {
  const fmt = (m) => {
    const [a, mes] = (m || "").split("-");
    if (!a) return "";
    return mes ? `${mes}/${a}` : a;
  };
  const i = fmt(inicio);
  const f = atual ? r.atual : fmt(fim);
  return [i, f].filter(Boolean).join(" – ");
}

function itensDe(exp) {
  if (exp.itens?.length) return exp.itens;
  return String(exp.descricao || "").split("\n").map((l) => l.replace(/^[-*•\s]+/, "").trim()).filter(Boolean);
}

// Casa letras com e sem acento ("comunicacao" acha "comunicação").
const ACENTOS = { a: "[aáàâã]", e: "[eéê]", i: "[ií]", o: "[oóôõ]", u: "[uúü]", c: "[cç]" };
function regexPalavras(palavras) {
  if (!palavras?.length) return null;
  const partes = [...palavras]
    .sort((a, b) => b.length - a.length)
    .map((p) => p.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/[aeiouc]/g, (l) => ACENTOS[l]));
  return new RegExp(`(?<![\\p{L}\\d])(${partes.join("|")})(?![\\p{L}\\d])`, "giu");
}

// Coloca em negrito as palavras-chave da vaga dentro de um texto.
function Destacar({ texto, re }) {
  if (!re) return texto;
  const pedacos = String(texto).split(re);
  return pedacos.map((p, i) => (i % 2 === 1 ? <strong key={i}>{p}</strong> : p));
}

// `ajuste` é o resultado da personalização para uma vaga; sem ele, mostra o currículo base.
export default function Curriculo({ perfil, ajuste, idioma = "pt" }) {
  const r = ROTULOS[idioma] || ROTULOS.pt;
  const titulo = ajuste?.titulo || perfil.titulo;
  const resumo = ajuste?.resumo ?? perfil.resumo;
  const competencias = ajuste?.competencias || perfil.competencias;
  const experiencias = ajuste?.experiencias || perfil.experiencias;
  const formacao = ajuste?.formacao || perfil.formacao;
  const projetos = (ajuste?.projetos || perfil.projetos || []).filter((p) => p.nome?.trim() || p.descricao?.trim());
  const contato = [perfil.email, perfil.telefone, perfil.cidade, perfil.linkedin, perfil.site].filter(Boolean);
  const re = regexPalavras(ajuste?.palavras);

  return (
    <article className="cv" lang={idioma}>
      <header>
        <h1>{perfil.nome || r.seuNome}</h1>
        {titulo && <div className="cargo">{titulo}</div>}
        {contato.length > 0 && (
          <div className="contato">{contato.map((c) => <span key={c}>{c}</span>)}</div>
        )}
      </header>

      {resumo && (
        <section>
          <h2>{r.resumo}</h2>
          <p><Destacar texto={resumo} re={re} /></p>
        </section>
      )}

      {competencias.length > 0 && (
        <section>
          <h2>{r.competencias}</h2>
          <div className="skills">
            {competencias.map((c) => (
              <span key={c} className="skill">{c}</span>
            ))}
          </div>
        </section>
      )}

      {experiencias.length > 0 && (
        <section>
          <h2>{r.experiencia}</h2>
          {experiencias.map((e) => (
            <div key={e.id} className="exp">
              <div className="exp-topo">
                <div><strong>{e.cargo}</strong>{e.empresa && ` · ${e.empresa}`}{e.local && <span style={{ color: "#666" }}> · {e.local}</span>}</div>
                <span className="periodo">{periodo(e.inicio, e.fim, e.atual, r)}</span>
              </div>
              {itensDe(e).length > 0 && <ul>{itensDe(e).map((l, i) => <li key={i}><Destacar texto={l} re={re} /></li>)}</ul>}
            </div>
          ))}
        </section>
      )}

      {projetos.length > 0 && (
        <section>
          <h2>{r.projetos}</h2>
          {projetos.map((p) => (
            <div key={p.id} className="exp">
              <div className="exp-topo">
                <div>
                  <strong>{p.nome}</strong>
                  {p.tecnologias && <span style={{ color: "#666" }}> · <Destacar texto={p.tecnologias} re={re} /></span>}
                </div>
                <span className="periodo">{periodo(p.inicio, p.fim, Boolean(p.inicio && !p.fim), r)}</span>
              </div>
              {p.link && <div className="periodo" style={{ whiteSpace: "normal" }}>{p.link}</div>}
              {itensDe(p).length > 0 && <ul>{itensDe(p).map((l, i) => <li key={i}><Destacar texto={l} re={re} /></li>)}</ul>}
            </div>
          ))}
        </section>
      )}

      {formacao.length > 0 && (
        <section>
          <h2>{r.formacao}</h2>
          {formacao.map((f) => (
            <div key={f.id} className="exp">
              <div className="exp-topo">
                <div><strong>{f.curso}</strong>{f.instituicao && ` · ${f.instituicao}`}{f.status && f.status !== "Concluído" && <span style={{ color: "#666" }}> · {r.status[f.status] || f.status}</span>}</div>
                <span className="periodo">{periodo(f.inicio, f.fim, false, r)}</span>
              </div>
              {itensDe(f).length > 0 && <ul>{itensDe(f).map((l, i) => <li key={i}><Destacar texto={l} re={re} /></li>)}</ul>}
            </div>
          ))}
        </section>
      )}

      {(perfil.idiomas.length > 0 || perfil.certificacoes.length > 0) && (
        <section>
          <h2>{r.idiomasCert}</h2>
          {perfil.idiomas.length > 0 && <p>{perfil.idiomas.map((i) => `${r.nomeIdioma(i.idioma)} (${r.nivel[i.nivel] || i.nivel})`).join(" · ")}</p>}
          {perfil.certificacoes.length > 0 && <ul>{perfil.certificacoes.map((c) => <li key={c}>{c}</li>)}</ul>}
        </section>
      )}
    </article>
  );
}
