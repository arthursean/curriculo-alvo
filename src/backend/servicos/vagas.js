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
// Cada pedido tem prazo: o que passar dele conta como falha e a busca segue com o resto. Assim
// uma fonte lenta não estoura o tempo máximo da função (Vercel) e não derruba a busca inteira.
const PRAZO_MS = 25_000;
const comPrazo = (promessa) =>
  Promise.race([promessa, new Promise((_, rej) => setTimeout(() => rej(new Error("demorou demais para responder")), PRAZO_MS))]);

async function coletarDaFonte(fonte, termos, comTodas, opcoes) {
  const tarefas = termos.map((t) => comPrazo(fonte.buscar(t, opcoes)));
  if (comTodas && fonte.todas) tarefas.push(comPrazo(fonte.todas(opcoes)));
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
// Uma busca (palavra-chave ou UMA área). Devolve a lista já com o limite e os ids de tudo o que
// passou nos filtros (para o total "800 de N").
async function buscarConjunto({ q, uf, cidade, raio = 0, dias, modalidades = [], niveis = [], areas = [] }) {
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
  const encontradasIds = vagas.map((v) => v.id); // antes do limite: a tela mostra "800 de N"
  // Descrições muito longas são cortadas na lista (a resposta da função tem limite de tamanho
  // na Vercel; 6.000 caracteres cobrem a descrição inteira da imensa maioria das vagas).
  const MAX_DESCRICAO = 6000;
  const cortar = (v) => (v.descricao?.length > MAX_DESCRICAO ? { ...v, descricao: `${v.descricao.slice(0, MAX_DESCRICAO)}…` } : v);
  if (noLocal) {
    const daRegiao = vagas.filter((v) => v.modalidade !== "remoto").slice(0, LIMITE);
    const remotas = vagas.filter((v) => v.modalidade === "remoto").slice(0, LIMITE - daRegiao.length);
    vagas = [...daRegiao, ...remotas].sort((a, b) => new Date(b.publicadaEm) - new Date(a.publicadaEm));
  } else {
    vagas = vagas.slice(0, LIMITE);
  }

  vagas = vagas.map(cortar);
  return { vagas, idsEncontradas: encontradasIds, fontes, termos: q ? [] : termosArea, regiaoCompleta: regiaoCoberta };
}

// A Vercel recusa respostas de função acima de 4,5 MB. Se a lista passar de ~3,8 MB (só em
// buscas muito grandes, como várias áreas sem estado), primeiro encurta as descrições longas e,
// se ainda não couber, deixa de fora as vagas mais antigas.
const ORCAMENTO_BYTES = 3_800_000;
const bytes = (vagas) => Buffer.byteLength(JSON.stringify(vagas));
function caberNaResposta(vagas) {
  if (bytes(vagas) <= ORCAMENTO_BYTES) return vagas;
  const curtas = vagas.map((v) => (v.descricao?.length > 3000 ? { ...v, descricao: `${v.descricao.slice(0, 3000)}…` } : v));
  let tamanho = bytes(curtas);
  if (tamanho <= ORCAMENTO_BYTES) return curtas;
  // Remove das mais antigas (fim da lista, que está em ordem de data) até caber.
  const medio = tamanho / curtas.length;
  return curtas.slice(0, Math.floor(ORCAMENTO_BYTES / medio));
}

// Várias áreas marcadas = a JUNÇÃO das buscas de cada área sozinha (cada uma com todos os seus
// termos e o seu próprio limite). Assim Tecnologia + Dados mostra exatamente as vagas de
// Tecnologia mais as de Dados. As fontes ficam em cache, então a região é baixada uma vez só.
export async function buscarVagas(params) {
  const q = String(params.q || "").trim();
  const areas = params.areas || [];
  if (!q && !areas.length) throw new ErroApp("Digite uma palavra-chave ou marque ao menos uma área.");
  const conjuntos = areas.length > 1 ? areas.map((a) => [a]) : [areas];
  const rs = await Promise.all(conjuntos.map((a) => buscarConjunto({ ...params, q, areas: a })));

  let vagas = [...new Map(rs.flatMap((r) => r.vagas).map((v) => [v.id, v])).values()]
    .sort((a, b) => new Date(b.publicadaEm) - new Date(a.publicadaEm));
  vagas = caberNaResposta(vagas);
  const encontradas = new Set(rs.flatMap((r) => r.idsEncontradas)).size;
  // Uma fonte está ok se respondeu em alguma das buscas.
  const porNome = new Map();
  for (const f of rs.flatMap((r) => r.fontes)) {
    const atual = porNome.get(f.nome);
    if (!atual || (!atual.ok && f.ok)) porNome.set(f.nome, { ...f });
  }
  const fontes = [...porNome.values()];
  // O total de cada fonte é contado no fim, depois de todos os filtros: assim a soma bate com a lista.
  for (const f of fontes) if (f.ok) f.total = vagas.filter((v) => v.fonte === f.nome).length;
  return {
    vagas,
    encontradas: Math.max(encontradas, vagas.length),
    fontes,
    termos: [...new Set(rs.flatMap((r) => r.termos))],
    regiaoCompleta: rs.some((r) => r.regiaoCompleta),
  };
}
