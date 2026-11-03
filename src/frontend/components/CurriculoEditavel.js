"use client";
import { useEffect, useRef, useState } from "react";
import { sanitizarHtml } from "@/frontend/lib/sanitizar";

const ACOES = [
  { cmd: "bold", rotulo: <strong>N</strong>, titulo: "Negrito (Ctrl+B)" },
  { cmd: "italic", rotulo: <em>I</em>, titulo: "Itálico (Ctrl+I)" },
  { cmd: "underline", rotulo: <u>S</u>, titulo: "Sublinhado (Ctrl+U)" },
  { cmd: "insertUnorderedList", rotulo: "• Lista", titulo: "Lista com marcadores" },
  { cmd: "removeFormat", rotulo: "Limpar", titulo: "Tirar negrito, itálico e sublinhado da seleção" },
  { cmd: "undo", rotulo: "↶", titulo: "Desfazer (Ctrl+Z)" },
  { cmd: "redo", rotulo: "↷", titulo: "Refazer (Ctrl+Y)" },
];

// Mostra o currículo gerado (children) ou a versão editada à mão (htmlSalvo), e permite editar
// o texto e a formatação direto na folha antes de imprimir / salvar em PDF.
export default function CurriculoEditavel({ children, htmlSalvo, onSalvar, onDescartar }) {
  const visual = useRef(null);
  const editor = useRef(null);
  const [editando, setEditando] = useState(false);
  const [inicial, setInicial] = useState("");
  const [salvando, setSalvando] = useState(false);

  // Coloca o conteúdo no editor uma vez ao abrir (o React não controla o texto durante a edição).
  useEffect(() => {
    if (!editando || !editor.current) return;
    editor.current.innerHTML = inicial;
    try {
      document.execCommand("styleWithCSS", false, false); // negrito vira <strong>/<b>, não style="..."
    } catch { /* navegador sem suporte */ }
    editor.current.focus();
  }, [editando, inicial]);

  function abrir() {
    setInicial(sanitizarHtml(htmlSalvo || visual.current?.innerHTML || ""));
    setEditando(true);
  }

  async function salvar() {
    setSalvando(true);
    try {
      await onSalvar(sanitizarHtml(editor.current.innerHTML));
      setEditando(false);
    } finally {
      setSalvando(false);
    }
  }

  function descartar() {
    if (window.confirm("Descartar suas edições e voltar ao currículo gerado pelo site?")) onDescartar();
  }

  // Colar sempre como texto puro: evita trazer fontes, cores e lixo de Word/sites.
  function colar(e) {
    e.preventDefault();
    document.execCommand("insertText", false, e.clipboardData.getData("text/plain"));
  }

  return (
    <div className="stack">
      <div className="item row between nao-imprimir">
        {!editando ? (
          <>
            <div className="small" style={{ flex: 1, minWidth: 220 }}>
              {htmlSalvo ? (
                <><strong>Versão editada por você.</strong> <span className="muted">Mudanças no perfil não alteram esta versão; descarte para gerar de novo.</span></>
              ) : (
                <span className="muted">Quer ajustar algum texto, negrito ou itálico antes de gerar o PDF?</span>
              )}
            </div>
            <div className="row">
              {htmlSalvo && <button className="btn ghost sm" onClick={descartar}>Descartar edições</button>}
              <button className="btn sec sm" onClick={abrir}>✎ Editar currículo</button>
            </div>
          </>
        ) : (
          <>
            <div className="barra-edicao" role="toolbar" aria-label="Formatação">
              {ACOES.map((a) => (
                <button
                  key={a.cmd}
                  type="button"
                  className="btn sec sm"
                  title={a.titulo}
                  aria-label={a.titulo}
                  // mousedown + preventDefault: o botão não rouba a seleção do texto
                  onMouseDown={(e) => {
                    e.preventDefault();
                    document.execCommand(a.cmd, false, null);
                  }}
                >
                  {a.rotulo}
                </button>
              ))}
            </div>
            <div className="row">
              <button className="btn ghost sm" onClick={() => setEditando(false)} disabled={salvando}>Cancelar</button>
              <button className="btn sm" onClick={salvar} disabled={salvando}>{salvando ? "Salvando…" : "Salvar edição"}</button>
            </div>
          </>
        )}
      </div>

      {editando && <p className="muted small nao-imprimir" style={{ margin: 0 }}>Clique no texto para editar. Selecione um trecho e use os botões (ou Ctrl+B / Ctrl+I / Ctrl+U).</p>}

      {editando ? (
        <div ref={editor} className="cv-editando" contentEditable suppressContentEditableWarning spellCheck onPaste={colar} />
      ) : htmlSalvo ? (
        <div dangerouslySetInnerHTML={{ __html: sanitizarHtml(htmlSalvo) }} />
      ) : (
        <div ref={visual}>{children}</div>
      )}
    </div>
  );
}
