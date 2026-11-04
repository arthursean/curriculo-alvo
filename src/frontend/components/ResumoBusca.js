"use client";
import { useMemo, useState } from "react";
import { MODALIDADES, NIVEIS } from "@/shared/vagas";

const NOME_MOD = Object.fromEntries(MODALIDADES.map((m) => [m.id, m.nome.toLowerCase()]));
const NOME_NIVEL = Object.fromEntries(NIVEIS.map((n) => [n.id, n.nome]));
const pct = (n, total) => Math.round((n / total) * 100);

// "O que essas vagas pedem": junta os requisitos de todas as vagas listadas, mostra os mais
// frequentes (com ✓ você tem / ≈ parecido / ✗ falta) e dicas para os que faltam.
export default function ResumoBusca({ vagas, avaliacoes }) {
  const [aberto, setAberto] = useState(true);
  const resumo = useMemo(() => {
    const avaliadas = vagas.map((v) => [v, avaliacoes.get(v.id)]).filter(([, a]) => a?.requisitos);
    const total = avaliadas.length;
    if (total < 3) return null;
    const contagem = new Map(); // nome -> { n, tem, via }
    for (const [, a] of avaliadas) {
      for (const r of new Map(a.requisitos.map((x) => [x.nome, x])).values()) {
        const c = contagem.get(r.nome) || { nome: r.nome, n: 0, tem: r.tem, via: r.via };
        c.n++;
        contagem.set(r.nome, c);
      }
    }
    // Só os mais relevantes: pedidos em pelo menos 20% das vagas, no máximo 8.
    // Variações do mesmo termo ("APIs" e "APIs REST") contam uma vez só, pela mais frequente.
    const frequentes = [];
    for (const c of [...contagem.values()].filter((c) => c.n / total >= 0.2).sort((a, b) => b.n - a.n)) {
      const nome = c.nome.toLowerCase();
      if (frequentes.some((f) => nome.startsWith(f.nome.toLowerCase()) || f.nome.toLowerCase().startsWith(nome))) continue;
      frequentes.push(c);
      if (frequentes.length === 8) break;
    }
    const conta = (campo) => {
      const m = new Map();
      for (const [v] of avaliadas) m.set(v[campo], (m.get(v[campo]) || 0) + 1);
      return [...m.entries()].sort((a, b) => b[1] - a[1]);
    };
    const mod = conta("modalidade");
    const niv = conta("nivel").filter(([id]) => id !== "nao_informado");
    const media = Math.round(avaliadas.reduce((s, [, a]) => s + a.compatibilidade, 0) / total);
    return { total, frequentes, mod, niv, media };
  }, [vagas, avaliacoes]);

  if (!resumo) return null;
  const { total, frequentes, mod, niv, media } = resumo;
  const faltam = frequentes.filter((f) => f.tem === "nao").slice(0, 3);
  const parecidos = frequentes.filter((f) => f.tem === "parecido").slice(0, 2);
  const temTudo = frequentes.length > 0 && !faltam.length && !parecidos.length;
  const icone = { sim: "✓", parecido: "≈", nao: "✗" };
  const classe = { sim: "ok", parecido: "pri", nao: "warn" };

  return (
    <div className="item stack resumo-busca">
      <button className="resumo-cabecalho" onClick={() => setAberto(!aberto)} aria-expanded={aberto}>
        <strong>O que essas vagas pedem</strong>
        <span className="muted small">{total} vagas analisadas · compatibilidade média {media}% {aberto ? "▲" : "▼"}</span>
      </button>
      {aberto && (
        <>
          <div className="tags">
            {frequentes.map((f) => (
              <span key={f.nome} className={`tag ${classe[f.tem]}`} title={f.tem === "sim" ? "Você tem" : f.tem === "parecido" ? `Você tem algo parecido${f.via ? `: ${f.via}` : ""}` : "Não aparece no seu perfil"}>
                {icone[f.tem]} {f.nome} · {pct(f.n, total)}%
              </span>
            ))}
          </div>
          <p className="muted small" style={{ margin: 0 }}>
            {mod.slice(0, 2).map(([id, n]) => `${pct(n, total)}% ${NOME_MOD[id] || id}`).join(" · ")}
            {niv.length > 0 && ` · nível mais comum: ${NOME_NIVEL[niv[0][0]]}`}
          </p>
          {(faltam.length > 0 || parecidos.length > 0 || temTudo) && (
            <ul className="small dicas-busca">
              {faltam.map((f) => (
                <li key={f.nome}>
                  <strong>{f.nome}</strong> aparece em {pct(f.n, total)}% das vagas e não está no seu perfil.{" "}
                  {f.nome === "Inglês" || f.nome === "Espanhol"
                    ? "Se você tem algum nível, cadastre em Idiomas — mesmo o intermediário ajuda."
                    : "Se você já usou, inclua em competências ou na descrição de uma experiência/projeto; se não, é o que mais vale a pena aprender para essas vagas."}
                </li>
              ))}
              {parecidos.map((f) => (
                <li key={f.nome}>
                  <strong>{f.nome}</strong> ({pct(f.n, total)}%): você tem {f.via || "algo parecido"}. Deixe claro no currículo e na entrevista que os conceitos são os mesmos.
                </li>
              ))}
              {temTudo && <li>Você tem os requisitos mais pedidos por essas vagas. Priorize as de maior compatibilidade.</li>}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
