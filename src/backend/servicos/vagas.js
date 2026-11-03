import "server-only";
import { montarVaga } from "@/shared/vagas";
import { contem, diasDesde } from "@/shared/texto";
import { ErroApp } from "@/backend/http/erros";
import * as gupy from "@/backend/vagas/fontes/gupy";
import * as solides from "@/backend/vagas/fontes/solides";
import * as adzuna from "@/backend/vagas/fontes/adzuna";
import * as remotive from "@/backend/vagas/fontes/remotive";
import * as arbeitnow from "@/backend/vagas/fontes/arbeitnow";

// Para incluir uma fonte nova: crie um módulo em backend/vagas/fontes com `nome` e `buscar(q, opcoes)`
// devolvendo vagas no formato comum (veja gupy.js), e acrescente aqui.
const FONTES = [gupy, solides, adzuna, remotive, arbeitnow];

// Busca em todas as fontes em paralelo; uma fonte fora do ar não derruba as outras.
export async function buscarVagas({ q, local, dias, modalidades = [], niveis = [], areas = [] }) {
  q = String(q || "").trim();
  if (!q) throw new ErroApp("Digite ao menos uma palavra-chave.");

  const resultados = await Promise.allSettled(FONTES.map((f) => f.buscar(q, { local, dias })));
  const fontes = [];
  let vagas = [];
  resultados.forEach((r, i) => {
    const { nome } = FONTES[i];
    if (r.status === "rejected") fontes.push({ nome, ok: false, detalhe: String(r.reason?.message || r.reason) });
    else if (r.value !== null) { // null = fonte opcional sem chave configurada
      fontes.push({ nome, ok: true, total: r.value.length });
      vagas.push(...r.value);
    }
  });

  vagas = vagas.map(montarVaga);
  // Público brasileiro: vaga de fora do país só aparece se for remota.
  vagas = vagas.filter((v) => !v.internacional || v.modalidade === "remoto");
  if (local) vagas = vagas.filter((v) => v.fonte === adzuna.nome || v.modalidade === "remoto" || contem(v.local, local));
  if (dias) vagas = vagas.filter((v) => diasDesde(v.publicadaEm) <= dias);
  if (modalidades.length) vagas = vagas.filter((v) => modalidades.includes(v.modalidade));
  if (niveis.length) vagas = vagas.filter((v) => niveis.includes(v.nivel));
  if (areas.length) vagas = vagas.filter((v) => areas.includes(v.area));
  vagas.sort((a, b) => new Date(b.publicadaEm) - new Date(a.publicadaEm));

  return { vagas: vagas.slice(0, 200), fontes };
}
