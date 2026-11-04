import "server-only";
import MUNICIPIOS from "@/backend/dados/municipios.json";
import { ufDe } from "@/shared/estados";
import { normalizar } from "@/shared/texto";

// { "PE": [["Recife", lat, lon], ...], ... } — fonte: kelvins/municipios-brasileiros (MIT).
const indice = new Map(); // "pe|recife" -> [lat, lon]
for (const [uf, lista] of Object.entries(MUNICIPIOS)) {
  for (const [nome, lat, lon] of lista) indice.set(`${uf}|${normalizar(nome)}`, [lat, lon]);
}

export function cidadesDaUf(uf) {
  return (MUNICIPIOS[String(uf || "").toUpperCase()] || []).map(([nome]) => nome);
}

export function coordenadas(cidade, uf) {
  return indice.get(`${String(uf || "").toUpperCase()}|${normalizar(cidade)}`) || null;
}

// Lê o "local" de uma vaga ("Recife, Pernambuco", "Recife - PE", "Recife/PE", "São Paulo, SP")
// e devolve { cidade, uf, coord }. Partes que não são estado são tentadas como cidade.
export function localizar(local) {
  const partes = String(local || "").split(/\s*[,/|–-]\s*/).map((p) => p.trim()).filter(Boolean);
  let uf = null;
  for (let i = partes.length - 1; i >= 0 && !uf; i--) uf = ufDe(partes[i]);
  if (!uf) return null;
  for (const p of partes) {
    const coord = coordenadas(p, uf);
    if (coord) return { cidade: p, uf, coord };
  }
  return { cidade: null, uf, coord: null };
}

// Distância em km entre dois pontos [lat, lon] (fórmula de haversine).
export function distanciaKm([lat1, lon1], [lat2, lon2]) {
  const rad = (g) => (g * Math.PI) / 180;
  const a = Math.sin(rad(lat2 - lat1) / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lon2 - lon1) / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(a));
}
