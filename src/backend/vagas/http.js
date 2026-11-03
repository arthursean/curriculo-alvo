import "server-only";

export async function buscarJson(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(12000), headers: { "User-Agent": "CurriculoAlvo/1.0" } });
  if (!res.ok) throw new Error(`${res.status} em ${new URL(url).host}`);
  return res.json();
}
