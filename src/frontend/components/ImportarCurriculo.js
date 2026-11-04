"use client";
import { useRef, useState } from "react";
import { importarCurriculo } from "@/frontend/lib/api";
import { mesclarNoPerfil } from "@/shared/importar";

const data = (v) => (v || "").split("-").reverse().join("/");
const periodo = (x) => [data(x.inicio), x.atual ? "atual" : data(x.fim)].filter(Boolean).join(" – ");

// Lê um currículo existente (PDF/DOCX/TXT), mostra o que foi encontrado e só aplica no perfil
// quando o usuário confirma. Nada do que já está preenchido é apagado: só completa e adiciona.
export default function ImportarCurriculo({ perfil, onAplicar }) {
  const [aberto, setAberto] = useState(false);
  const [lendo, setLendo] = useState(false);
  const [erro, setErro] = useState("");
  const [lido, setLido] = useState(null);
  const entrada = useRef(null);

  async function escolher(e) {
    const arquivo = e.target.files?.[0];
    e.target.value = "";
    if (!arquivo) return;
    setErro("");
    setLido(null);
    if (arquivo.size > 3 * 1024 * 1024) return setErro("Arquivo maior que 3 MB.");
    setLendo(true);
    try {
      setLido(await importarCurriculo(arquivo));
    } catch (e) {
      setErro(e.message);
    } finally {
      setLendo(false);
    }
  }

  function aplicar() {
    onAplicar(mesclarNoPerfil(perfil, lido.perfil));
    setLido(null);
    setAberto(false);
  }

  const p = lido?.perfil;
  const nada = p && !p.nome && !p.experiencias.length && !p.formacao.length && !p.competencias.length;

  return (
    <section className="card stack importar">
      <div className="row between">
        <h2 style={{ margin: 0 }}>
          Importar currículo <span className="selo-beta">BETA</span>
        </h2>
        {!aberto && <button className="btn" onClick={() => setAberto(true)}>Importar arquivo</button>}
      </div>
      {aberto && (
        <>
          <p className="muted small" style={{ margin: 0 }}>
            Envie seu currículo em PDF (com texto, não imagem), DOCX ou TXT, até 3 MB. Esta função está em <strong>beta</strong>: a
            leitura é automática e pode errar — confira tudo antes de aplicar. O arquivo não fica salvo; só preenchemos os campos
            vazios e adicionamos itens novos, sem apagar o que você já tem.
          </p>
          <div className="row">
            <input ref={entrada} type="file" accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain" onChange={escolher} hidden />
            <button className="btn primary" onClick={() => entrada.current?.click()} disabled={lendo}>
              {lendo ? "Lendo…" : "Escolher arquivo"}
            </button>
            <button className="btn ghost" onClick={() => { setAberto(false); setLido(null); setErro(""); }}>Cancelar</button>
          </div>
          {erro && <div className="alerta">{erro}</div>}
          {p && (
            <div className="stack revisao-importar">
              {nada ? (
                <div className="alerta">Não consegui identificar as seções desse arquivo. Tente outro formato ou preencha manualmente.</div>
              ) : (
                <>
                  <strong>Encontrei:</strong>
                  <ul className="small">
                    {p.nome && <li><b>Nome:</b> {p.nome}</li>}
                    {(p.email || p.telefone) && <li><b>Contato:</b> {[p.email, p.telefone, p.linkedin].filter(Boolean).join(" · ")}</li>}
                    {p.resumo && <li><b>Resumo:</b> {p.resumo.slice(0, 160)}{p.resumo.length > 160 ? "…" : ""}</li>}
                    {p.experiencias.length > 0 && (
                      <li><b>Experiências ({p.experiencias.length}):</b>
                        <ul>{p.experiencias.map((x) => <li key={x.id}>{[x.cargo, x.empresa].filter(Boolean).join(" — ")} <span className="muted">{periodo(x)}</span></li>)}</ul>
                      </li>
                    )}
                    {p.formacao.length > 0 && (
                      <li><b>Formação ({p.formacao.length}):</b>
                        <ul>{p.formacao.map((x) => <li key={x.id}>{[x.curso, x.instituicao].filter(Boolean).join(" — ")}</li>)}</ul>
                      </li>
                    )}
                    {p.projetos.length > 0 && <li><b>Projetos:</b> {p.projetos.map((x) => x.nome).join(", ")}</li>}
                    {p.competencias.length > 0 && <li><b>Competências:</b> {p.competencias.join(", ")}</li>}
                    {p.idiomas.length > 0 && <li><b>Idiomas:</b> {p.idiomas.map((x) => `${x.idioma} (${x.nivel})`).join(", ")}</li>}
                    {p.certificacoes.length > 0 && <li><b>Certificações:</b> {p.certificacoes.join(", ")}</li>}
                  </ul>
                  {lido.avisos?.length > 0 && (
                    <ul className="small muted">{lido.avisos.map((a) => <li key={a}>{a}</li>)}</ul>
                  )}
                  <div className="row">
                    <button className="btn primary" onClick={aplicar}>Aplicar ao perfil</button>
                    <span className="muted small">Você pode editar ou remover qualquer item depois.</span>
                  </div>
                </>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}
