"use client";
import { useId, useMemo, useRef, useState } from "react";
import { normalizar } from "@/shared/texto";

// Campo com sugestões: a lista fica escondida e aparece filtrada conforme a digitação.
// Setas ↑/↓ navegam, Enter escolhe, Esc fecha. Texto fora da lista também é aceito.
export default function Autocompletar({ valor, onChange, opcoes, placeholder, style }) {
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

  function escolher(opcao) {
    onChange(opcao);
    setAberto(false);
  }

  function teclas(e) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!aberto) return setAberto(true);
      const n = filtradas.length;
      if (!n) return;
      const prox = (ativo + (e.key === "ArrowDown" ? 1 : -1) + n) % n;
      setAtivo(prox);
      lista.current?.children[prox]?.scrollIntoView({ block: "nearest" });
    } else if (e.key === "Enter" && aberto && filtradas[ativo]) {
      e.preventDefault();
      escolher(filtradas[ativo]);
    } else if (e.key === "Escape") {
      setAberto(false);
    }
  }

  return (
    <div className="autocompletar" style={style}>
      <input
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
        onBlur={() => setAberto(false)}
        onKeyDown={teclas}
      />
      {aberto && filtradas.length > 0 && (
        <ul id={listaId} role="listbox" ref={lista} className="sugestoes">
          {filtradas.map((o, i) => (
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
