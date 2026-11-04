"use client";

// Navegação entre páginas da lista: anterior / próxima e um seletor para pular direto.
export default function Paginacao({ pagina, totalPaginas, onMudar, inicio, fim, total }) {
  if (totalPaginas <= 1) return null;
  return (
    <nav className="paginacao" aria-label="Páginas de vagas">
      <button type="button" className="btn sec sm" disabled={pagina <= 1} onClick={() => onMudar(pagina - 1)}>‹ Anterior</button>
      <label className="paginacao-meio">
        <span className="muted small">Página</span>
        <select value={pagina} onChange={(e) => onMudar(Number(e.target.value))} aria-label="Ir para a página">
          {Array.from({ length: totalPaginas }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}
        </select>
        <span className="muted small">de {totalPaginas} · vagas {inicio}–{fim} de {total}</span>
      </label>
      <button type="button" className="btn sec sm" disabled={pagina >= totalPaginas} onClick={() => onMudar(pagina + 1)}>Próxima ›</button>
    </nav>
  );
}
