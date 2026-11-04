import "server-only";

// No máximo N pedidos simultâneos por site: uma busca por área dispara dezenas de pedidos e
// não queremos sobrecarregar (nem ser bloqueados por) Gupy, Sólides etc.
const MAX_POR_SITE = 10;
const filas = new Map(); // host -> { ativos, espera: [] }

async function naFila(host, tarefa) {
  const f = filas.get(host) || { ativos: 0, espera: [] };
  filas.set(host, f);
  if (f.ativos >= MAX_POR_SITE) await new Promise((ok) => f.espera.push(ok));
  f.ativos++;
  try {
    return await tarefa();
  } finally {
    f.ativos--;
    f.espera.shift()?.();
  }
}

// Respostas guardadas por alguns minutos (mesma busca de novo, ou trocar só um filtro, não baixa
// tudo outra vez). Limitado em quantidade para não crescer sem controle.
const cache = new Map(); // url -> { ate, promessa }
const MAX_CACHE = 150; // páginas da Gupy têm ~350 KB: até ~50 MB

export async function buscarJson(url, { cacheMin = 0 } = {}) {
  if (cacheMin) {
    const c = cache.get(url);
    if (c && c.ate > Date.now()) return c.promessa;
  }
  const promessa = naFila(new URL(url).host, async () => {
    const res = await fetch(url, { signal: AbortSignal.timeout(15000), headers: { "User-Agent": "CurriculoAlvo/1.0" } });
    if (!res.ok) throw new Error(`${res.status} em ${new URL(url).host}`);
    return res.json();
  });
  if (cacheMin) {
    if (cache.size >= MAX_CACHE) cache.delete(cache.keys().next().value);
    cache.set(url, { ate: Date.now() + cacheMin * 60_000, promessa });
    promessa.catch(() => cache.delete(url));
  }
  return promessa;
}
