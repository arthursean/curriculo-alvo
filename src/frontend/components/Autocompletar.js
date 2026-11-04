"use client";
import { useId, useMemo, useRef, useState } from "react";
import { normalizar } from "@/shared/texto";

// Campo com sugestões: a lista fica escondida e aparece filtrada conforme a digitação.
// Setas ↑/↓ navegam, Enter escolhe, Esc fecha. Texto fora da lista é aceito, a não ser com
// `restrito`: aí, ao sair do campo, só fica um valor da lista (ex.: "rwcife" não passa como cidade).

export default function Autocompletar({ valor, onChange, opcoes, placeholder, style, restrito = false, disabled = false, id }) {
  const [aberto, setAberto] = useState(false);
  const [ativo, setAtivo] = useState(0);
  const listaId = useId();
  const lista = useRef(null);

  const filtradas = useMemo(() => {
    const t = normalizar(valor).trim();
    if (!t) return opcoes;
    const comeca = opcoes.filter((o) => normalizar(o).startsWith(t));
    const contem = opcoes.filter((o) => !comeca.includes(o) && normalizar(o).includes(t));
    return [...comeca, ...contem];
  }, [valor, opcoes]);
  // Mostra todas: a lista rola até o fim (MG, o maior estado, tem 853 cidades).
  const visiveis = filtradas;

  // Modo restrito: ao sair, troca o texto pela opção igual (ignorando acento/maiúscula) ou limpa.
  function validar() {
    setAberto(false);
    if (!restrito || !valor) return;
    const igual = opcoes.find((o) => normalizar(o) === normalizar(valor).trim());
    if (igual !== valor) onChange(igual || "");
  }

  function escolher(opcao) {
    onChange(opcao);
    setAberto(false);
  }

  function teclas(e) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!aberto) return setAberto(true);
      const n = visiveis.length;
      if (!n) return;
      const prox = (ativo + (e.key === "ArrowDown" ? 1 : -1) + n) % n;
      setAtivo(prox);
      lista.current?.children[prox]?.scrollIntoView({ block: "nearest" });
    } else if (e.key === "Enter" && aberto && visiveis[ativo]) {
      e.preventDefault();
      escolher(visiveis[ativo]);
    } else if (e.key === "Escape") {
      setAberto(false);
    }
  }

  return (
    <div className="autocompletar" style={style}>
      <input
        id={id}
        disabled={disabled}
        role="combobox"
        aria-expanded={aberto}
        aria-controls={listaId}
        aria-autocomplete="list"
        autoComplete="off"
        value={valor}
        placeholder={placeholder}
        onChange={(e) => {
          onChange(e.target.value);
          setAtivo(0);
          setAberto(true);
        }}
        onFocus={() => setAberto(true)}
        onBlur={validar}
        onKeyDown={teclas}
      />
      {aberto && visiveis.length > 0 && (
        <ul id={listaId} role="listbox" ref={lista} className="sugestoes">
          {visiveis.map((o, i) => (
            <li
              key={o}
              role="option"
              aria-selected={i === ativo}
              className={i === ativo ? "ativa" : ""}
              // mousedown (e não click) para escolher antes do campo perder o foco
              onMouseDown={(e) => {
                e.preventDefault();
                escolher(o);
              }}
              onMouseEnter={() => setAtivo(i)}
            >
              {o}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
