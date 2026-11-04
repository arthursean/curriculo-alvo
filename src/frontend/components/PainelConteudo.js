"use client";
import { useState } from "react";

const SECOES = [
  ["experiencias", "Experiências"],
  ["projetos", "Projetos"],
  ["formacao", "Formação"],
];

// Competências: chips com + / −, e um campo para adicionar uma só nesta vaga.
function Competencias({ itens, onAlternar, onAdicionar, onRemoverExtra }) {
  const [nova, setNova] = useState("");
  function adicionar(e) {
    e.preventDefault();
    const t = nova.trim();
    if (!t) return;
    onAdicionar(t);
    setNova("");
  }
  return (
    <div>
      <strong className="small">Competências</strong>
      <div className="chips-conteudo">
        {itens.map((c) => (
          <button
            key={c.id}
            className={`chip ${c.incluida ? "dentro" : "fora"}`}
            onClick={() => (c.extra ? onRemoverExtra(c.id) : onAlternar("competencias", c.id, !c.incluida))}
            aria-pressed={c.incluida}
            title={c.extra ? "Remover (adicionada por você)" : c.incluida ? "Tirar deste currículo" : "Incluir neste currículo"}
          >
            <span aria-hidden>{c.incluida ? "−" : "+"}</span> {c.rotulo}
            {c.extra ? <em> (sua)</em> : !c.sugerida && <em> (pouco relevante)</em>}
          </button>
        ))}
      </div>
      <form className="row" style={{ marginTop: 8, gap: 8 }} onSubmit={adicionar}>
        <input value={nova} onChange={(e) => setNova(e.target.value)} placeholder="Adicionar competência só nesta vaga" style={{ flex: 1, minWidth: 180, width: "auto" }} maxLength={60} />
        <button className="btn sec sm" disabled={!nova.trim()}>+ Adicionar</button>
      </form>
    </div>
  );
}

// "O que entra neste currículo": itens do seu perfil com + (incluir) / − (tirar) só para esta vaga.
// A sugestão vem do algoritmo (o que tem relação com a vaga); a sua escolha sempre prevalece.
export default function PainelConteudo({ secoes, onAlternar, onAdicionarCompetencia, onRemoverCompetenciaExtra, onRestaurar }) {
  if (!secoes) return null;
  const temManual = [...SECOES.map(([k]) => k), "competencias"].some((k) => secoes[k]?.some((i) => i.escolhaManual || i.extra));
  const visiveis = SECOES.filter(([k]) => secoes[k]?.length);

  return (
    <div className="item stack nao-imprimir">
      <div className="row between">
        <div>
          <strong>O que entra neste currículo</strong>
          <p className="muted small" style={{ margin: "2px 0 0" }}>
            Itens do seu perfil. Os “pouco relevantes” ficam de fora por padrão; use + / − para mudar só nesta vaga.
          </p>
        </div>
        {temManual && <button className="btn ghost sm" onClick={onRestaurar}>Voltar à sugestão</button>}
      </div>
      <Competencias
        itens={secoes.competencias || []}
        onAlternar={onAlternar}
        onAdicionar={onAdicionarCompetencia}
        onRemoverExtra={onRemoverCompetenciaExtra}
      />
      {visiveis.map(([chave, titulo]) => (
        <div key={chave}>
          <strong className="small">{titulo}</strong>
          <ul className="lista-conteudo">
            {secoes[chave].map((i) => (
              <li key={i.id} className={i.incluida ? "dentro" : "fora"}>
                <button
                  className={`btn sm ${i.incluida ? "sec" : ""}`}
                  onClick={() => onAlternar(chave, i.id, !i.incluida)}
                  aria-pressed={i.incluida}
                  title={i.incluida ? "Tirar deste currículo" : "Incluir neste currículo"}
                >
                  {i.incluida ? "−" : "+"}
                </button>
                <span className="rotulo">{i.rotulo}</span>
                {!i.sugerida && <span className="tag warn">pouco relevante</span>}
                {i.escolhaManual && <span className="tag pri">sua escolha</span>}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
