"use client";
import { useCallback, useEffect, useState } from "react";
import { carregarCandidaturas, desmarcarEnviada, marcarEnviada } from "@/frontend/lib/api";

// Vagas marcadas como "candidatura enviada": carrega uma vez e alterna com atualização imediata
// na tela (se o servidor recusar, volta ao estado anterior).
export function useCandidaturas() {
  const [enviadas, setEnviadas] = useState(() => new Map());
  const [erro, setErro] = useState("");
  const [carregado, setCarregado] = useState(false);

  useEffect(() => {
    carregarCandidaturas()
      .then((lista) => {
        setEnviadas(new Map(lista.map((c) => [c.vaga.id, c])));
        setCarregado(true);
      })
      .catch(() => {});
  }, []);

  const alternar = useCallback(async (vaga, compatibilidade) => {
    setErro("");
    const era = enviadas.has(vaga.id);
    const anterior = enviadas;
    const nova = new Map(enviadas);
    if (era) nova.delete(vaga.id);
    else nova.set(vaga.id, { vaga, compatibilidade, enviadaEm: new Date().toISOString() });
    setEnviadas(nova);
    try {
      if (era) await desmarcarEnviada(vaga.id);
      else await marcarEnviada(vaga, compatibilidade);
    } catch (e) {
      setEnviadas(anterior);
      setErro(e.message);
    }
  }, [enviadas]);

  return { enviadas, alternar, erro, carregado };
}

export default function BotaoEnviada({ enviada, onClick, pequeno = true, curto = false }) {
  return (
    <button
      type="button"
      className={`btn ${pequeno ? "sm" : ""} ${enviada ? "enviada" : "sec"}`}
      aria-pressed={enviada}
      onClick={onClick}
      title={enviada ? "Clique para desmarcar" : "Marque quando você se candidatar a esta vaga"}
    >
      {enviada ? (curto ? "✓ Enviada" : "✓ Candidatura enviada") : curto ? "Marcar enviada" : "Marcar como enviada"}
    </button>
  );
}
