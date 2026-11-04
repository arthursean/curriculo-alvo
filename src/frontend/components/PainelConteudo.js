"use client";

const SECOES = [
  ["experiencias", "Experiências"],
  ["projetos", "Projetos"],
  ["formacao", "Formação"],
];

// "O que entra neste currículo": itens do seu perfil com + (incluir) / − (tirar) só para esta vaga.
// A sugestão vem do algoritmo (o que tem relação com a vaga); a sua escolha sempre prevalece.
export default function PainelConteudo({ secoes, onAlternar, onRestaurar }) {
  if (!secoes) return null;
  const temManual = SECOES.some(([k]) => secoes[k]?.some((i) => i.escolhaManual));
  const visiveis = SECOES.filter(([k]) => secoes[k]?.length);
  if (!visiveis.length) return null;

  return (
    <div className="item stack nao-imprimir">
      <div className="row between">
        <div>
          <strong>O que entra neste currículo</strong>
          <p className="muted small" style={{ margin: "2px 0 0" }}>
            Itens do seu perfil. Os marcados como “pouco relevante” ficam de fora por padrão; use + / − para mudar só nesta vaga.
          </p>
        </div>
        {temManual && <button className="btn ghost sm" onClick={onRestaurar}>Voltar à sugestão</button>}
      </div>
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
