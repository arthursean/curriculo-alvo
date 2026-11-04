import "server-only";
import { areasDaVaga, montarVaga, termosParaAreas } from "@/shared/vagas";
import { contem, diasDesde, normalizar } from "@/shared/texto";
import { coordenadas, distanciaKm, localizar, ufsNoRaio } from "@/backend/geo/municipios";
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

// Coleta de uma fonte: busca por cada termo e, se pedido, a lista completa (`todas`) da fonte.
// Só falha se tudo falhar; null = fonte opcional sem chave configurada.
async function coletarDaFonte(fonte, termos, comTodas, opcoes) {
  const tarefas = termos.map((t) => fonte.buscar(t, opcoes));
  if (comTodas && fonte.todas) tarefas.push(fonte.todas(opcoes));
  const r = await Promise.allSettled(tarefas);
  const ok = r.filter((x) => x.status === "fulfilled");
  if (!ok.length) throw r[0].reason;
  if (ok.every((x) => x.value === null)) return null;
  return ok.flatMap((x) => x.value || []);
}

const PALAVRAS_VAZIAS = new Set(["de", "da", "do", "das", "dos", "e", "em", "para", "com", "a", "o", "of", "the", "and"]);
const palavrasDe = (q) => normalizar(q).split(/[\s,;/]+/).filter((p) => p.length > 1 && !PALAVRAS_VAZIAS.has(p));

// Busca em todas as fontes em paralelo; uma fonte fora do ar não derruba as outras.
// As ÁREAS marcadas definem o conjunto: com local escolhido, vêm TODAS as vagas da região (e as
// remotas pelos termos da área), cada uma classificada aqui. A PALAVRA-CHAVE só filtra: a vaga
// precisa ter todas as palavras no título, nas tags ou na descrição. Assim digitar uma palavra
// nunca traz mais vagas do que só marcar a área.
export async function buscarVagas({ q, uf, cidade, raio = 0, dias, modalidades = [], niveis = [], areas = [] }) {
  q = String(q || "").trim();
  if (!q && !areas.length) throw new ErroApp("Digite uma palavra-chave ou marque ao menos uma área.");
  const termosArea = areas.length ? termosParaAreas(areas) : [];
  // Com áreas, a palavra-chave NÃO vira busca nas fontes (traria vagas fora do conjunto da área):
  // ela só filtra o que a área trouxe. Sem áreas, a palavra-chave é a própria busca.
  const termos = areas.length ? termosArea : [q];
  const noLocal = filtroDeLocal({ uf, cidade, raio });
  // Estados que o raio alcança: as fontes que filtram por estado (Gupy, Sólides) pedem só esses,
  // além de buscar as remotas à parte. O filtro fino (cidade/raio) continua aqui.
  const centro = uf && cidade ? coordenadas(cidade, uf) : null;
  const ufs = uf ? ufsNoRaio(centro, Number(raio) || 0, uf) : [];
  // Com muitos termos, uma página de remotas por termo basta (os termos já se sobrepõem).
  // Com local escolhido, `todas` traz a região inteira (Gupy e Sólides) e tudo o mais só filtra:
  // os termos (palavra-chave ou da área) servem apenas para achar as remotas. Assim marcar uma
  // área ou digitar uma palavra nunca traz MAIS vagas da região do que sem elas.
  const regiaoCoberta = ufs.length > 0;
  const opcoes = { dias, ufs, paginasRemotas: termos.length > 2 ? 1 : 2, regiaoCoberta };
  const comTodas = regiaoCoberta || areas.length > 0;
  const resultados = await Promise.allSettled(FONTES.map((f) => coletarDaFonte(f, termos, comTodas, opcoes)));
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
  const palavras = palavrasDe(q);
  if (palavras.length) {
    vagas = vagas.filter((v) => {
      const texto = `${v.titulo} ${(v.tags || []).join(" ")} ${v.descricao}`;
      return palavras.every((p) => contem(texto, p));
    });
  }
  vagas.sort((a, b) => new Date(b.publicadaEm) - new Date(a.publicadaEm));
  // Limite da lista. Com local escolhido, as vagas da região entram todas e as remotas completam:
  // senão centenas de remotas recentes empurravam para fora as vagas mais antigas da região.
  const LIMITE = 800;
  const encontradas = vagas.length; // antes do limite: a tela mostra "800 de N"
  if (noLocal) {
    const daRegiao = vagas.filter((v) => v.modalidade !== "remoto").slice(0, LIMITE);
    const remotas = vagas.filter((v) => v.modalidade === "remoto").slice(0, LIMITE - daRegiao.length);
    vagas = [...daRegiao, ...remotas].sort((a, b) => new Date(b.publicadaEm) - new Date(a.publicadaEm));
  } else {
    vagas = vagas.slice(0, LIMITE);
  }

  // O total de cada fonte é contado no fim, depois de todos os filtros: assim a soma bate com a lista.
  for (const f of fontes) if (f.ok) f.total = vagas.filter((v) => v.fonte === f.nome).length;
  return { vagas, encontradas, fontes, termos: q ? [] : termosArea, regiaoCompleta: regiaoCoberta };
}
