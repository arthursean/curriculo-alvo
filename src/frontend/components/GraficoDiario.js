"use client";
import { useState } from "react";

const DIA_SEMANA = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
const dataCurta = (iso) => {
  const [a, m, d] = iso.split("-").map(Number);
  return `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}`;
};
const dataLonga = (iso) => {
  const [a, m, d] = iso.split("-").map(Number);
  return `${DIA_SEMANA[new Date(a, m - 1, d).getDay()]}, ${dataCurta(iso)}`;
};

// Barras por dia (uma série só, sem legenda: o título diz o que é). Passar o mouse ou o foco
// mostra o valor do dia; "Ver como tabela" dá os mesmos números em texto.
export default function GraficoDiario({ serie, rotulo, unidade }) {
  const [ativo, setAtivo] = useState(null);
  const [tabela, setTabela] = useState(false);
  const max = Math.max(1, ...serie.map((d) => d.vagas));
  // Escala "redonda" para a linha de referência do topo.
  const topo = max <= 4 ? max : Math.ceil(max / 5) * 5;
  const total = serie.reduce((s, d) => s + d.vagas, 0);
  const sel = ativo != null ? serie[ativo] : null;

  return (
    <div className="grafico">
      <div className="grafico-topo">
        <span className="muted small">{sel ? `${dataLonga(sel.dia)}: ${sel.vagas} ${unidade}` : `${total} ${unidade} em ${serie.length} dias`}</span>
        <button type="button" className="btn ghost sm" onClick={() => setTabela(!tabela)}>{tabela ? "Ver gráfico" : "Ver como tabela"}</button>
      </div>
      {tabela ? (
        <div className="grafico-tabela">
          <table>
            <thead><tr><th>Dia</th><th>{rotulo}</th></tr></thead>
            <tbody>
              {serie.filter((d) => d.vagas > 0).reverse().map((d) => <tr key={d.dia}><td>{dataLonga(d.dia)}</td><td>{d.vagas}</td></tr>)}
            </tbody>
          </table>
          {total === 0 && <p className="muted small">Nenhuma atividade no período.</p>}
        </div>
      ) : (
        <div className="grafico-area" role="img" aria-label={`${rotulo}: ${total} ${unidade} nos últimos ${serie.length} dias`} onMouseLeave={() => setAtivo(null)}>
          <div className="grafico-ref" style={{ bottom: "100%" }}><span>{topo}</span></div>
          <div className="grafico-ref" style={{ bottom: "50%" }}><span>{topo / 2 % 1 ? "" : topo / 2}</span></div>
          <div className="grafico-barras">
            {serie.map((d, i) => (
              <button
                type="button"
                key={d.dia}
                className={`grafico-coluna ${ativo === i ? "ativa" : ""}`}
                onMouseEnter={() => setAtivo(i)}
                onFocus={() => setAtivo(i)}
                onBlur={() => setAtivo(null)}
                aria-label={`${dataLonga(d.dia)}: ${d.vagas} ${unidade}`}
              >
                {d.vagas > 0 && <span className="grafico-barra" style={{ height: `${(d.vagas / topo) * 100}%` }} />}
              </button>
            ))}
          </div>
          <div className="grafico-eixo">
            <span>{dataCurta(serie[0].dia)}</span>
            <span>{dataCurta(serie[Math.floor(serie.length / 2)].dia)}</span>
            <span>hoje</span>
          </div>
        </div>
      )}
    </div>
  );
}
