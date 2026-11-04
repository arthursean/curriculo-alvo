"use client";
import { useEffect, useRef, useState } from "react";
import { sanitizarHtml } from "@/frontend/lib/sanitizar";

const ACOES = [
  { cmd: "bold", rotulo: <strong>N</strong>, titulo: "Negrito (Ctrl+B)" },
  { cmd: "italic", rotulo: <em>I</em>, titulo: "Itálico (Ctrl+I)" },
  { cmd: "underline", rotulo: <u>S</u>, titulo: "Sublinhado (Ctrl+U)" },
  { cmd: "removeFormat", rotulo: "Limpar", titulo: "Tirar negrito, itálico e sublinhado da seleção" },
  { cmd: "undo", rotulo: "↶", titulo: "Desfazer (Ctrl+Z)" },
  { cmd: "redo", rotulo: "↷", titulo: "Refazer (Ctrl+Y)" },
];

// Na edição só a APARÊNCIA muda (negrito, itálico, sublinhado). O texto em si vem do perfil e do
// que você escolheu incluir na vaga: digitar, apagar, colar e arrastar ficam bloqueados.
const PERMITIDO = /^(format(Bold|Italic|Underline|RemoveFormat)|history(Undo|Redo))$/;

// Mostra o currículo gerado (children) ou a versão formatada por você (htmlSalvo).
export default function CurriculoEditavel({ children, htmlSalvo, onSalvar, onDescartar }) {
  const visual = useRef(null);
  const editor = useRef(null);
  const [editando, setEditando] = useState(false);
  const [inicial, setInicial] = useState("");
  const [salvando, setSalvando] = useState(false);

  // Coloca o conteúdo no editor uma vez ao abrir (o React não controla o texto durante a edição).
  useEffect(() => {
    if (!editando || !editor.current) return;
    const el = editor.current;
    el.innerHTML = inicial;
    try {
      document.execCommand("styleWithCSS", false, false); // negrito vira <b>/<strong>, não style="..."
    } catch { /* navegador sem suporte */ }
    const bloquear = (e) => {
      if (!PERMITIDO.test(e.inputType)) e.preventDefault();
    };
    el.addEventListener("beforeinput", bloquear);
    el.focus();
    return () => el.removeEventListener("beforeinput", bloquear);
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
    if (window.confirm("Tirar a formatação que você fez e voltar ao visual padrão?")) onDescartar();
  }

  const impedir = (e) => e.preventDefault();

  return (
    <div className="stack">
      <div className="item row between nao-imprimir">
        {!editando ? (
          <>
            <div className="small" style={{ flex: 1, minWidth: 220 }}>
              {htmlSalvo ? (
                <><strong>Com a sua formatação.</strong> <span className="muted">Se o conteúdo mudar (perfil ou itens incluídos), a formatação é refeita do zero.</span></>
              ) : (
                <span className="muted">Quer destacar algo com negrito, itálico ou sublinhado antes de gerar o PDF?</span>
              )}
            </div>
            <div className="row">
              {htmlSalvo && <button className="btn ghost sm" onClick={descartar}>Tirar formatação</button>}
              <button className="btn sec sm" onClick={abrir}>✎ Formatar texto</button>
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
              <button className="btn sm" onClick={salvar} disabled={salvando}>{salvando ? "Salvando…" : "Salvar formatação"}</button>
            </div>
          </>
        )}
      </div>

      {editando && <p className="muted small nao-imprimir" style={{ margin: 0 }}>Selecione um trecho e use os botões (ou Ctrl+B / Ctrl+I / Ctrl+U). Para incluir ou tirar experiências, use o painel “O que entra neste currículo”.</p>}

      {editando ? (
        <div ref={editor} className="cv-editando" contentEditable suppressContentEditableWarning spellCheck={false}
          onPaste={impedir} onDrop={impedir} onCut={impedir} onDragStart={impedir} />
      ) : htmlSalvo ? (
        <div dangerouslySetInnerHTML={{ __html: sanitizarHtml(htmlSalvo) }} />
      ) : (
        <div ref={visual}>{children}</div>
      )}
    </div>
  );
}
