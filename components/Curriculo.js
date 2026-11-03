function periodo(inicio, fim, atual) {
  const fmt = (m) => {
    if (!m) return "";
    const [a, mes] = m.split("-");
    return mes ? `${mes}/${a}` : a;
  };
  const i = fmt(inicio);
  const f = atual ? "atual" : fmt(fim);
  return [i, f].filter(Boolean).join(" – ");
}

function itensDe(exp) {
  if (exp.itens?.length) return exp.itens;
  return String(exp.descricao || "").split("\n").map((l) => l.replace(/^[-*•\s]+/, "").trim()).filter(Boolean);
}

// `ajuste` é o resultado da personalização para uma vaga; sem ele, mostra o currículo base.
export default function Curriculo({ perfil, ajuste }) {
  const titulo = ajuste?.titulo || perfil.titulo;
  const resumo = ajuste?.resumo ?? perfil.resumo;
  const competencias = ajuste?.competencias || perfil.competencias;
  const destaques = new Set(ajuste?.destaques || []);
  const experiencias = ajuste?.experiencias || perfil.experiencias;
  const contato = [perfil.email, perfil.telefone, perfil.cidade, perfil.linkedin, perfil.site].filter(Boolean);

  return (
    <article className="cv">
      <header>
        <h1>{perfil.nome || "Seu nome"}</h1>
        {titulo && <div className="cargo">{titulo}</div>}
        {contato.length > 0 && (
          <div className="contato">{contato.map((c) => <span key={c}>{c}</span>)}</div>
        )}
      </header>

      {resumo && (
        <section>
          <h2>Resumo profissional</h2>
          <p>{resumo}</p>
        </section>
      )}

      {competencias.length > 0 && (
        <section>
          <h2>Competências</h2>
          <div className="skills">
            {competencias.map((c) => (
              <span key={c} className={`skill ${destaques.has(c) ? "destaque" : ""}`}>{c}</span>
            ))}
          </div>
        </section>
      )}

      {experiencias.length > 0 && (
        <section>
          <h2>Experiência profissional</h2>
          {experiencias.map((e) => (
            <div key={e.id} className="exp">
              <div className="exp-topo">
                <div><strong>{e.cargo}</strong>{e.empresa && ` · ${e.empresa}`}{e.local && <span style={{ color: "#666" }}> · {e.local}</span>}</div>
                <span className="periodo">{periodo(e.inicio, e.fim, e.atual)}</span>
              </div>
              {itensDe(e).length > 0 && <ul>{itensDe(e).map((l, i) => <li key={i}>{l}</li>)}</ul>}
            </div>
          ))}
        </section>
      )}

      {perfil.formacao.length > 0 && (
        <section>
          <h2>Formação acadêmica</h2>
          {perfil.formacao.map((f) => (
            <div key={f.id} className="exp">
              <div className="exp-topo">
                <div><strong>{f.curso}</strong>{f.instituicao && ` · ${f.instituicao}`}{f.status && f.status !== "Concluído" && <span style={{ color: "#666" }}> · {f.status}</span>}</div>
                <span className="periodo">{periodo(f.inicio, f.fim)}</span>
              </div>
            </div>
          ))}
        </section>
      )}

      {(perfil.idiomas.length > 0 || perfil.certificacoes.length > 0) && (
        <section>
          <h2>Idiomas e certificações</h2>
          {perfil.idiomas.length > 0 && <p>{perfil.idiomas.map((i) => `${i.idioma} (${i.nivel})`).join(" · ")}</p>}
          {perfil.certificacoes.length > 0 && <ul>{perfil.certificacoes.map((c) => <li key={c}>{c}</li>)}</ul>}
        </section>
      )}
    </article>
  );
}
