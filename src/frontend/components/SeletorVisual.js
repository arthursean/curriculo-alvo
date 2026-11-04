"use client";
import { CORES, MODELOS } from "@/shared/modelos";

// Desenho de cada modelo, sem dados: só blocos no lugar do nome, títulos e texto.
function Previa({ modelo, cor }) {
  const texto = (n) => Array.from({ length: n }, (_, i) => <i key={i} className={i === n - 1 ? "m-curta" : ""} />);
  const secao = (linhas) => (
    <div className="m-corpo">
      <i className="m-titulo" />
      {texto(linhas)}
    </div>
  );
  return (
    <div className={`mini tema-${modelo}`} style={{ "--cv-cor": cor }} aria-hidden>
      {modelo === "executivo" ? (
        <div className="m-faixa"><i className="m-nome" /><i className="m-curta" /></div>
      ) : (
        <>
          <i className="m-nome" />
          <i className="m-linha" />
        </>
      )}
      {modelo === "moderno" ? (
        <div className="m-colunas">
          <div className="m-corpo">{secao(4)}{secao(3)}</div>
          <div className="m-lado">{secao(3)}{secao(2)}</div>
        </div>
      ) : (
        <>
          {secao(2)}
          {secao(modelo === "compacto" ? 5 : 3)}
          {secao(modelo === "compacto" ? 4 : 2)}
          {modelo === "compacto" && secao(3)}
        </>
      )}
    </div>
  );
}

// Escolha do modelo (com prévia) e da cor secundária do currículo.
export default function SeletorVisual({ modelo, cor, onChange }) {
  return (
    <div className="item stack nao-imprimir">
      <div>
        <strong>Visual do currículo</strong>
        <p className="muted small" style={{ margin: "2px 0 0" }}>O conteúdo e a sua formatação continuam iguais em qualquer modelo.</p>
      </div>
      <div className="seletor-visual" role="radiogroup" aria-label="Modelo do currículo">
        {MODELOS.map((m) => (
          <button
            key={m.id}
            type="button"
            role="radio"
            aria-checked={modelo === m.id}
            className={`opcao-modelo ${modelo === m.id ? "ativa" : ""}`}
            onClick={() => onChange({ modelo: m.id, cor })}
            title={m.descricao}
          >
            <Previa modelo={m.id} cor={cor} />
            <span className="nome-modelo">{m.nome}</span>
          </button>
        ))}
      </div>
      <div className="cores">
        <span className="small"><strong>Cor secundária</strong></span>
        {CORES.map((c) => (
          <button
            key={c}
            type="button"
            className={`cor ${cor.toLowerCase() === c.toLowerCase() ? "ativa" : ""}`}
            style={{ background: c }}
            onClick={() => onChange({ modelo, cor: c })}
            aria-label={`Cor ${c}`}
            title={c}
          />
        ))}
        <label className="check" title="Escolher outra cor">
          <input type="color" value={cor} onChange={(e) => onChange({ modelo, cor: e.target.value })} aria-label="Outra cor" />
          <span className="small muted">Outra</span>
        </label>
      </div>
    </div>
  );
}
