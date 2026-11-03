"use client";

const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const ANO_ATUAL = new Date().getFullYear();

// Escolha de mês e ano por listas, sem digitação. Valor no formato "AAAA-MM" (ou "" quando vazio).
export default function MesAno({ id, valor, onChange, disabled, anosFuturos = 0 }) {
  const [ano = "", mes = ""] = (valor || "").split("-");
  const anos = [];
  for (let a = ANO_ATUAL + anosFuturos; a >= 1960; a--) anos.push(String(a));

  function mudar(novoMes, novoAno) {
    // Só grava quando os dois estão escolhidos; com um só, guarda o parcial para não perder a escolha.
    if (!novoMes && !novoAno) return onChange("");
    onChange(`${novoAno}-${novoMes}`);
  }

  return (
    <div className="mes-ano">
      <select id={id} aria-label="Mês" value={mes} disabled={disabled} onChange={(e) => mudar(e.target.value, ano)}>
        <option value="">Mês</option>
        {MESES.map((m, i) => {
          const v = String(i + 1).padStart(2, "0");
          return <option key={v} value={v}>{m}</option>;
        })}
      </select>
      <select aria-label="Ano" value={ano} disabled={disabled} onChange={(e) => mudar(mes, e.target.value)}>
        <option value="">Ano</option>
        {anos.map((a) => <option key={a} value={a}>{a}</option>)}
      </select>
    </div>
  );
}
