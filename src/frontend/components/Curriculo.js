import { ROTULOS } from "@/shared/traducao";
import { ehSoftSkill } from "@/shared/skills";
import { ehTopico, partesInline, tirarTopico } from "@/shared/formatacao";
import { Fragment } from "react";

// Visual do currículo: segue o modelo de referência (A4, Arial, nome centralizado em verde-petróleo,
// linha fina, contatos com links azuis, títulos de seção em Verdana negrito e cada experiência como
// "EMPRESA | CARGO | PERÍODO" seguida de um parágrafo justificado).

function mesAno(m) {
  const [a, mes] = (m || "").split("-");
  if (!a) return "";
  return mes ? `${mes}/${a}` : a;
}

function periodo(inicio, fim, atual, r) {
  const i = mesAno(inicio);
  const f = atual ? r.atualmente : mesAno(fim);
  return [i, f].filter(Boolean).join(" - ");
}

function itensDe(item) {
  if (item.itens?.length) return item.itens;
  return String(item.descricao || "").split("\n").map((l) => l.trim()).filter(Boolean);
}

// Negrito, itálico e sublinhado marcados no perfil (veja shared/formatacao.js).
function Inline({ texto }) {
  return partesInline(texto).map((p, i) => {
    let n = p.t;
    if (p.u) n = <u>{n}</u>;
    if (p.i) n = <em>{n}</em>;
    if (p.b) n = <strong>{n}</strong>;
    return <Fragment key={i}>{n}</Fragment>;
  });
}

// Cada linha da descrição fica num bloco próprio; as marcadas como tópico ganham o marcador.
function Linhas({ itens }) {
  return itens.map((t, i) =>
    ehTopico(t) ? (
      <span key={i} className="cv-topico"><Inline texto={tirarTopico(t)} /></span>
    ) : (
      <span key={i} className="cv-linha"><Inline texto={t} /></span>
    )
  );
}

const linha = (...partes) => partes.filter(Boolean).join(" | ");

// Links de contato: só http(s) e e-mail.
function hrefDe(valor) {
  const v = String(valor).trim();
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return `mailto:${v}`;
  if (/^https?:\/\//i.test(v)) return v;
  if (/^(www\.|[a-z0-9-]+\.(com|com\.br|io|dev|me|net|org|app|br)(\/|$))/i.test(v)) return `https://${v}`;
  return null;
}

function Contato({ itens }) {
  return (
    <p className="cv-contato">
      {itens.map((c, i) => {
        const href = hrefDe(c);
        return (
          <span key={c}>
            {i > 0 && " | "}
            {href ? <a href={href}>{c}</a> : c}
          </span>
        );
      })}
    </p>
  );
}

function Item({ titulo, subtitulo, itens }) {
  return (
    <div className="cv-item">
      <p className="cv-item-titulo">{titulo}</p>
      {subtitulo && <p className="cv-item-sub">{subtitulo}</p>}
      {itens.length > 0 && <p className="cv-item-texto"><Linhas itens={itens} /></p>}
    </div>
  );
}

// `ajuste` é o resultado da personalização para uma vaga; sem ele, mostra o currículo base.
export default function Curriculo({ perfil, ajuste, idioma = "pt" }) {
  const r = ROTULOS[idioma] || ROTULOS.pt;
  const resumo = ajuste?.resumo ?? perfil.resumo;
  const competencias = ajuste?.competencias || perfil.competencias;
  const experiencias = ajuste?.experiencias || perfil.experiencias;
  const formacao = ajuste?.formacao || perfil.formacao;
  const projetos = (ajuste?.projetos || perfil.projetos || []).filter((p) => p.nome?.trim() || p.descricao?.trim());
  // Cidade vem como "Cidade, UF" (ou ", UF" se só o estado foi escolhido).
  const contato = [perfil.telefone, perfil.email, perfil.linkedin, perfil.site, (perfil.cidade || "").replace(/^,\s*/, "")].filter(Boolean);

  // Hard skills: ferramentas e técnicas + idiomas ("Inglês fluente"), numa linha só.
  const idiomas = perfil.idiomas.filter((i) => i.idioma).map((i) => `${r.nomeIdioma(i.idioma)} ${(r.nivel[i.nivel] || i.nivel).toLowerCase()}`);
  const hard = [...competencias.filter((c) => !ehSoftSkill(c)), ...idiomas];
  // Soft skills: o texto escrito no perfil; se não houver, as competências comportamentais da lista.
  const soft = perfil.softSkills?.trim() || competencias.filter(ehSoftSkill).join(" | ");

  // Duas colunas lógicas: a principal (resumo, experiência, projetos, formação) e a lateral
  // (skills e certificações). Cada modelo visual decide se ficam uma embaixo da outra ou lado a lado.
  return (
    <article className="cv" lang={idioma}>
      <header className="cv-topo">
        <h1>{perfil.nome || r.seuNome}</h1>
        <hr />
        {contato.length > 0 && <Contato itens={contato} />}
      </header>

      <div className="cv-corpo">
      <div className="cv-principal">
      {resumo && <p className="cv-resumo">{resumo}</p>}

      {experiencias.length > 0 && (
        <section>
          <h2>{r.experiencia}</h2>
          {experiencias.map((e) => (
            <Item key={e.id} titulo={linha(e.empresa, e.cargo, periodo(e.inicio, e.fim, e.atual, r))} subtitulo={e.local} itens={itensDe(e)} />
          ))}
        </section>
      )}

      {projetos.length > 0 && (
        <section>
          <h2>{r.projetos}</h2>
          {projetos.map((p) => (
            <Item key={p.id} titulo={linha(p.nome, p.tecnologias, periodo(p.inicio, p.fim, Boolean(p.inicio && !p.fim), r))} subtitulo={p.link} itens={itensDe(p)} />
          ))}
        </section>
      )}

      {formacao.length > 0 && (
        <section>
          <h2>{r.formacao}</h2>
          {formacao.map((f) => (
            <Item
              key={f.id}
              titulo={linha(f.instituicao, f.curso, periodo(f.inicio, f.fim, false, r))}
              subtitulo={f.status && f.status !== "Concluído" ? r.status[f.status] || f.status : null}
              itens={itensDe(f)}
            />
          ))}
        </section>
      )}
      </div>

      <div className="cv-lateral">
      {hard.length > 0 && (
        <section>
          <h2>{r.hardSkills}</h2>
          <p className="cv-hard">{hard.map((h, i) => <span key={h}>{i > 0 && <span className="cv-sep"> | </span>}{h}</span>)}</p>
        </section>
      )}

      {soft && (
        <section>
          <h2>{r.softSkills}</h2>
          <p className="cv-soft">{soft}</p>
        </section>
      )}

      {perfil.certificacoes.length > 0 && (
        <section>
          <h2>{r.certificacoes}</h2>
          <p className="cv-item-texto">{perfil.certificacoes.join(" | ")}</p>
        </section>
      )}
      </div>
      </div>
    </article>
  );
}
