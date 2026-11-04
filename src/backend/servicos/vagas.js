import "server-only";
import { areasDaVaga, montarVaga, termosParaAreas } from "@/shared/vagas";
import { diasDesde } from "@/shared/texto";
import { coordenadas, distanciaKm, localizar } from "@/backend/geo/municipios";
import { ErroApp } from "@/backend/http/erros";
import * as gupy from "@/backend/vagas/fontes/gupy";
import * as solides from "@/backend/vagas/fontes/solides";
import * as adzuna from "@/backend/vagas/fontes/adzuna";
import * as remotive from "@/backend/vagas/fontes/remotive";
import * as arbeitnow from "@/backend/vagas/fontes/arbeitnow";
import * as trampos from "@/backend/vagas/fontes/trampos";

// Para incluir uma fonte nova: crie um módulo em backend/vagas/fontes com `nome` e `buscar(q, opcoes)`
// devolvendo vagas no formato comum (veja gupy.js), e acrescente aqui.
const FONTES = [gupy, solides, trampos, adzuna, remotive, arbeitnow];

// Filtro de local: estado, cidade e raio em km a partir da cidade. Vaga remota sempre passa
// (não depende de onde a pessoa mora). Vaga cujo local não dá para identificar fica de fora.
function filtroDeLocal({ uf, cidade, raio }) {
  uf = String(uf || "").toUpperCase();
  if (!uf) return null;
  raio = Math.max(0, Math.min(1000, Number(raio) || 0));
  const centro = cidade ? coordenadas(cidade, uf) : null;
  if (cidade && !centro) throw new ErroApp("Cidade não encontrada nesse estado. Escolha uma cidade da lista.");
  return (v) => {
    if (v.modalidade === "remoto") return true;
    const onde = localizar(v.local);
    if (!onde) return false;
    if (!centro) return onde.uf === uf;
    if (!onde.coord) return false;
    const km = distanciaKm(centro, onde.coord);
    v.distanciaKm = Math.round(km);
    return raio ? km <= raio : km < 1; // sem raio: só a própria cidade
  };
}

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
export async function buscarVagas({ q, uf, cidade, raio = 0, dias, modalidades = [], niveis = [], areas = [] }) {
  q = String(q || "").trim();
  const termos = q ? [q] : termosParaAreas(areas);
  if (!termos.length) throw new ErroApp("Digite uma palavra-chave ou marque ao menos uma área.");
  const noLocal = filtroDeLocal({ uf, cidade, raio });

  // O local é filtrado só aqui (nunca na fonte): assim as vagas remotas nunca somem por causa da cidade.
  const resultados = await Promise.allSettled(FONTES.map((f) => buscarNaFonte(f, termos, { dias })));
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
  if (noLocal) vagas = vagas.filter(noLocal);
  if (dias) vagas = vagas.filter((v) => diasDesde(v.publicadaEm) <= dias);
  if (modalidades.length) vagas = vagas.filter((v) => modalidades.includes(v.modalidade));
  if (niveis.length) vagas = vagas.filter((v) => niveis.includes(v.nivel));
  if (areas.length) vagas = vagas.filter((v) => areasDaVaga(v).some((a) => areas.includes(a)));
  vagas.sort((a, b) => new Date(b.publicadaEm) - new Date(a.publicadaEm));
  vagas = vagas.slice(0, 200);

  // O total de cada fonte é contado no fim, depois de todos os filtros: assim a soma bate com a lista.
  for (const f of fontes) if (f.ok) f.total = vagas.filter((v) => v.fonte === f.nome).length;
  return { vagas, fontes, termos: q ? [] : termos };
}
