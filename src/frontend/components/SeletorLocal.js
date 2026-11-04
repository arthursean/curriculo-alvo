"use client";
import { useEffect, useId, useState } from "react";
import Autocompletar from "@/frontend/components/Autocompletar";
import { cidadesDoEstado } from "@/frontend/lib/api";
import { ESTADOS } from "@/shared/estados";

// Estado + cidade escolhidos de listas fixas (sem erro de digitação). A cidade só aceita
// nomes que existem naquele estado. `rotulos` = false para usar só os campos (ex.: no perfil).
export default function SeletorLocal({ uf, cidade, onChange, obrigatorioCidade = false }) {
  const [cidades, setCidades] = useState([]);
  const idUf = useId();
  const idCidade = useId();

  useEffect(() => {
    let vivo = true;
    setCidades([]);
    cidadesDoEstado(uf).then((c) => vivo && setCidades(c)).catch(() => {});
    return () => {
      vivo = false;
    };
  }, [uf]);

  return (
    <div className="seletor-local">
      <div>
        <label htmlFor={idUf}>Estado</label>
        <select id={idUf} value={uf || ""} onChange={(e) => onChange({ uf: e.target.value, cidade: "" })}>
          <option value="">{obrigatorioCidade ? "Selecione" : "Todo o Brasil"}</option>
          {ESTADOS.map((e) => <option key={e.uf} value={e.uf}>{e.nome}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor={idCidade}>Cidade</label>
        <Autocompletar
          id={idCidade}
          restrito
          disabled={!uf}
          valor={cidade || ""}
          opcoes={cidades}
          onChange={(c) => onChange({ uf, cidade: c })}
          placeholder={uf ? (obrigatorioCidade ? "Digite e escolha" : "Todas do estado") : "Escolha o estado"}
        />
      </div>
    </div>
  );
}
