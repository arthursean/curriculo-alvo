"use client";
import { useState } from "react";

// Formulário simples das telas de conta: campos, envio, erro e mensagem de sucesso.
export default function FormConta({ titulo, subtitulo, campos, botao, enviar, rodape }) {
  const [valores, setValores] = useState(Object.fromEntries(campos.map((c) => [c.nome, ""])));
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function aoEnviar(e) {
    e.preventDefault();
    setErro("");
    setMensagem("");
    setEnviando(true);
    try {
      const msg = await enviar(valores);
      if (msg) setMensagem(msg);
    } catch (err) {
      setErro(err.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form className="card stack auth" onSubmit={aoEnviar}>
      <div>
        <h1>{titulo}</h1>
        {subtitulo && <p className="muted" style={{ margin: 0 }}>{subtitulo}</p>}
      </div>
      {campos.map((c) => (
        <div key={c.nome}>
          <label htmlFor={c.nome}>{c.rotulo}</label>
          <input
            id={c.nome}
            type={c.tipo || "text"}
            autoComplete={c.autocomplete}
            required
            minLength={c.minimo}
            value={valores[c.nome]}
            onChange={(e) => setValores((v) => ({ ...v, [c.nome]: e.target.value }))}
          />
          {c.ajuda && <p className="muted small" style={{ margin: "4px 0 0" }}>{c.ajuda}</p>}
        </div>
      ))}
      {erro && <div className="alerta">{erro}</div>}
      {mensagem && <div className="alerta info">{mensagem}</div>}
      <button className="btn" disabled={enviando}>{enviando ? "Aguarde…" : botao}</button>
      {rodape && <div className="small muted">{rodape}</div>}
    </form>
  );
}
