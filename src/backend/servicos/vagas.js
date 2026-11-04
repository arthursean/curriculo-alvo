import "server-only";
import { montarVaga, termosParaAreas } from "@/shared/vagas";
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

// Uma fonte com vários termos: junta os resultados; só falha se todos os termos falharem.
async function buscarNaFonte(fonte, termos, opcoes) {
  const r = await Promise.allSettled(termos.map((t) => fonte.buscar(t, opcoes)));
  const ok = r.filter((x) => x.status === "fulfilled");
  if (!ok.length) throw r[0].reason;
  if (ok.every((x) => x.value === null)) return null; // fonte opcional sem chave configurada
  return ok.flatMap((x) => x.value || []);
}

// Busca em todas as fontes em paralelo; uma fonte fora do ar não derruba as outras.
// Sem palavra-chave, mas com áreas marcadas, busca pelos termos típicos de cada área.
export async function buscarVagas({ q, local, dias, modalidades = [], niveis = [], areas = [] }) {
  q = String(q || "").trim();
  const termos = q ? [q] : termosParaAreas(areas);
  if (!termos.length) throw new ErroApp("Digite uma palavra-chave ou marque ao menos uma área.");

  const resultados = await Promise.allSettled(FONTES.map((f) => buscarNaFonte(f, termos, { local, dias })));
  const fontes = [];
  let vagas = [];
  resultados.forEach((r, i) => {
    const { nome } = FONTES[i];
    if (r.status === "rejected") fontes.push({ nome, ok: false, detalhe: String(r.reason?.message || r.reason) });
    else if (r.value !== null) { // null = fonte opcional sem chave configurada
      fontes.push({ nome, ok: true });
      vagas.push(...r.value);
    }
  });

  // A mesma vaga pode vir repetida (ex.: duas páginas da mesma fonte): fica uma só.
  vagas = [...new Map(vagas.map((v) => [v.id, v])).values()].map(montarVaga);
  // Público brasileiro: vaga de fora do país só aparece se for remota.
  vagas = vagas.filter((v) => !v.internacional || v.modalidade === "remoto");
  if (local) vagas = vagas.filter((v) => v.fonte === adzuna.nome || v.modalidade === "remoto" || contem(v.local, local));
  if (dias) vagas = vagas.filter((v) => diasDesde(v.publicadaEm) <= dias);
  if (modalidades.length) vagas = vagas.filter((v) => modalidades.includes(v.modalidade));
  if (niveis.length) vagas = vagas.filter((v) => niveis.includes(v.nivel));
  if (areas.length) vagas = vagas.filter((v) => areas.includes(v.area));
  vagas.sort((a, b) => new Date(b.publicadaEm) - new Date(a.publicadaEm));
  vagas = vagas.slice(0, 200);

  // O total de cada fonte é contado no fim, depois de todos os filtros: assim a soma bate com a lista.
  for (const f of fontes) if (f.ok) f.total = vagas.filter((v) => v.fonte === f.nome).length;
  return { vagas, fontes, termos: q ? [] : termos };
}
