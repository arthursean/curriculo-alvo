"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { carregarCurriculos, removerCurriculo, useProtegido } from "@/lib/cliente";
import { tempoRelativo } from "@/lib/texto";

export default function MeusCurriculos() {
  const { dados, erro } = useProtegido(carregarCurriculos);
  const [lista, setLista] = useState(null);
  useEffect(() => setLista(dados), [dados]);

  if (erro) return <div className="alerta">{erro}</div>;
  if (!lista) return <div className="vazio">Carregando…</div>;

  async function excluir(vagaId) {
    await removerCurriculo(vagaId);
    setLista((l) => l.filter((c) => c.vaga.id !== vagaId));
  }

  return (
    <div className="stack">
      <div>
        <h1>Currículos salvos</h1>
        <p className="muted" style={{ margin: 0 }}>Um currículo para cada vaga que você escolheu.</p>
      </div>
      {lista.length === 0 && (
        <div className="card vazio">Nenhum currículo personalizado ainda. <Link href="/vagas">Busque uma vaga</Link> para começar.</div>
      )}
      {lista.map(({ vaga, ajuste, criadoEm }) => (
        <div key={vaga.id} className="item row between">
          <div style={{ flex: 1, minWidth: 220 }}>
            <strong>{vaga.titulo}</strong>
            <div className="muted small">{vaga.empresa} · gerado {tempoRelativo(criadoEm)} · compatibilidade {ajuste.compatibilidade}%</div>
          </div>
          <div className="row">
            <Link className="btn sm" href={`/personalizar?vaga=${encodeURIComponent(vaga.id)}`}>Abrir</Link>
            <button className="btn ghost sm" onClick={() => excluir(vaga.id)}>Excluir</button>
          </div>
        </div>
      ))}
    </div>
  );
}
