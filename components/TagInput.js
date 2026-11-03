"use client";
import { useState } from "react";

export default function TagInput({ valores, onChange, placeholder }) {
  const [texto, setTexto] = useState("");

  function adicionar() {
    const novos = texto.split(",").map((t) => t.trim()).filter((t) => t && !valores.includes(t));
    if (novos.length) onChange([...valores, ...novos]);
    setTexto("");
  }

  return (
    <div>
      <div className="row">
        <input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              adicionar();
            }
          }}
          placeholder={placeholder}
          style={{ flex: 1, minWidth: 180, width: "auto" }}
        />
        <button type="button" className="btn sec" onClick={adicionar}>Adicionar</button>
      </div>
      {valores.length > 0 && (
        <div className="tags" style={{ marginTop: 10 }}>
          {valores.map((v) => (
            <span key={v} className="tag pri">
              {v}
              <button type="button" aria-label={`Remover ${v}`} onClick={() => onChange(valores.filter((x) => x !== v))}>×</button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
