"use client";
import { useEffect, useRef } from "react";
import { MARCA_TOPICO, ehTopico, montarInline, partesInline, tirarTopico } from "@/shared/formatacao";

// Campo de descrição com formatação: negrito, itálico, sublinhado e tópicos, editados direto
// no texto (sem símbolos). Por baixo, o valor continua sendo texto simples com marcas leves
// (veja shared/formatacao.js), que o currículo, a personalização e a tradução entendem.

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function paraHtml(texto) {
  if (!texto) return "";
  return String(texto)
    .split("\n")
    .map((linha) => {
      const topico = ehTopico(linha);
      const corpo = partesInline(topico ? tirarTopico(linha) : linha)
        .map((p) => {
          let h = esc(p.t);
          if (p.u) h = `<u>${h}</u>`;
          if (p.i) h = `<i>${h}</i>`;
          if (p.b) h = `<b>${h}</b>`;
          return h;
        })
        .join("");
      return `<div${topico ? ' class="ed-topico"' : ""}>${corpo || "<br>"}</div>`;
    })
    .join("");
}

const BLOCOS = new Set(["DIV", "P", "LI", "UL", "OL", "H1", "H2", "H3", "BLOCKQUOTE"]);

function estiloDe(el, herdado) {
  const e = { ...herdado };
  const t = el.tagName;
  if (t === "B" || t === "STRONG") e.b = true;
  if (t === "I" || t === "EM") e.i = true;
  if (t === "U") e.u = true;
  const st = el.style;
  if (st) {
    if (st.fontWeight === "bold" || Number(st.fontWeight) >= 600) e.b = true;
    if (st.fontWeight === "normal" || st.fontWeight === "400") e.b = false;
    if (st.fontStyle === "italic") e.i = true;
    if (/underline/.test(st.textDecoration || st.textDecorationLine || "")) e.u = true;
  }
  return e;
}

// Lê o conteúdo editável e devolve o texto com marcas.
function paraTexto(raiz) {
  const linhas = [];
  let partes = [];
  let topico = false;
  const fecharLinha = () => {
    const corpo = montarInline(partes);
    linhas.push(topico && corpo.trim() ? MARCA_TOPICO + corpo : corpo);
    partes = [];
  };
  const andar = (no, estilo) => {
    for (const filho of no.childNodes) {
      if (filho.nodeType === Node.TEXT_NODE) {
        partes.push({ t: filho.nodeValue.replace(/ /g, " ").replace(/\n/g, " "), ...estilo });
      } else if (filho.nodeType === Node.ELEMENT_NODE) {
        if (filho.tagName === "BR") {
          // <br> sozinho no fim de um bloco é só o "segura-linha" do navegador
          if (filho.nextSibling || !BLOCOS.has(no.tagName) || no === raiz) fecharLinha();
        } else if (BLOCOS.has(filho.tagName)) {
          if (partes.length) fecharLinha();
          const ant = topico;
          topico = filho.tagName === "LI" || filho.classList.contains("ed-topico");
          andar(filho, estiloDe(filho, estilo));
          if (!["UL", "OL"].includes(filho.tagName)) fecharLinha();
          topico = ant;
        } else {
          andar(filho, estiloDe(filho, estilo));
        }
      }
    }
  };
  andar(raiz, { b: false, i: false, u: false });
  if (partes.length) fecharLinha();
  while (linhas.length && !linhas.at(-1).trim()) linhas.pop();
  return linhas.join("\n");
}

// Blocos (linhas) que a seleção atual toca; o texto solto na raiz vira bloco antes.
function blocosSelecionados(raiz) {
  const sel = window.getSelection();
  if (!sel.rangeCount || !raiz.contains(sel.anchorNode)) return [];
  if ([...raiz.childNodes].some((n) => n.nodeType === Node.TEXT_NODE || !BLOCOS.has(n.tagName))) {
    const range = sel.getRangeAt(0).cloneRange();
    const div = document.createElement("div");
    while (raiz.firstChild && (raiz.firstChild.nodeType === Node.TEXT_NODE || !BLOCOS.has(raiz.firstChild.tagName))) div.appendChild(raiz.firstChild);
    raiz.insertBefore(div, raiz.firstChild);
    sel.removeAllRanges();
    sel.addRange(range);
  }
  const range = sel.getRangeAt(0);
  return [...raiz.children].filter((b) => range.intersectsNode(b));
}

export default function EditorTexto({ valor, onChange, placeholder, rotulo, minimo = 96 }) {
  const ref = useRef(null);
  const ultimo = useRef(null);

  useEffect(() => {
    if (valor !== ultimo.current && ref.current) {
      ref.current.innerHTML = paraHtml(valor);
      ultimo.current = valor;
    }
  }, [valor]);

  function emitir(e) {
    const texto = paraTexto(ref.current);
    // Ao sair de um campo vazio, limpa as sobras do navegador para o texto de exemplo aparecer.
    if (e?.type === "blur" && !texto) ref.current.innerHTML = "";
    if (texto === ultimo.current) return;
    ultimo.current = texto;
    onChange(texto);
  }

  function formatar(comando) {
    ref.current.focus();
    document.execCommand("styleWithCSS", false, false);
    document.execCommand(comando);
    emitir();
  }

  function alternarTopico() {
    ref.current.focus();
    const blocos = blocosSelecionados(ref.current);
    if (!blocos.length) {
      ref.current.innerHTML = `<div class="ed-topico"><br></div>`;
      const r = document.createRange();
      r.setStart(ref.current.firstChild, 0);
      window.getSelection().removeAllRanges();
      window.getSelection().addRange(r);
    } else {
      const todos = blocos.every((b) => b.classList.contains("ed-topico"));
      blocos.forEach((b) => b.classList.toggle("ed-topico", !todos));
    }
    emitir();
  }

  function teclas(e) {
    // Enter num tópico vazio sai da lista (como nos editores de texto).
    if (e.key === "Enter" && !e.shiftKey) {
      const [bloco] = blocosSelecionados(ref.current);
      if (bloco?.classList.contains("ed-topico") && !bloco.textContent.trim()) {
        e.preventDefault();
        bloco.classList.remove("ed-topico");
        emitir();
      }
    }
  }

  // Colagem só como texto: nada de estilos, imagens ou scripts de outros sites.
  function colar(e) {
    e.preventDefault();
    const texto = e.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, texto);
  }

  const botao = (titulo, conteudo, acao, atalho) => (
    <button type="button" className="ed-botao" title={atalho ? `${titulo} (${atalho})` : titulo} aria-label={titulo} onMouseDown={(e) => e.preventDefault()} onClick={acao}>
      {conteudo}
    </button>
  );

  return (
    <div className="editor-texto">
      <div className="ed-barra" role="toolbar" aria-label="Formatação">
        {botao("Negrito", <b>N</b>, () => formatar("bold"), "Ctrl+B")}
        {botao("Itálico", <i>I</i>, () => formatar("italic"), "Ctrl+I")}
        {botao("Sublinhado", <u>S</u>, () => formatar("underline"), "Ctrl+U")}
        <span className="ed-divisor" />
        {botao("Tópicos", "• Tópicos", alternarTopico)}
      </div>
      <div
        ref={ref}
        className="ed-area"
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label={rotulo || placeholder}
        data-placeholder={placeholder}
        style={{ minHeight: minimo }}
        onInput={emitir}
        onBlur={emitir}
        onKeyDown={teclas}
        onPaste={colar}
      />
    </div>
  );
}
