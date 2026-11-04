// Os 27 estados do Brasil (para os seletores de local). Fonte: kelvins/municipios-brasileiros (MIT).
export const ESTADOS = [
  {"uf":"AC","nome":"Acre"},
  {"uf":"AL","nome":"Alagoas"},
  {"uf":"AP","nome":"Amapá"},
  {"uf":"AM","nome":"Amazonas"},
  {"uf":"BA","nome":"Bahia"},
  {"uf":"CE","nome":"Ceará"},
  {"uf":"DF","nome":"Distrito Federal"},
  {"uf":"ES","nome":"Espírito Santo"},
  {"uf":"GO","nome":"Goiás"},
  {"uf":"MA","nome":"Maranhão"},
  {"uf":"MT","nome":"Mato Grosso"},
  {"uf":"MS","nome":"Mato Grosso do Sul"},
  {"uf":"MG","nome":"Minas Gerais"},
  {"uf":"PA","nome":"Pará"},
  {"uf":"PB","nome":"Paraíba"},
  {"uf":"PR","nome":"Paraná"},
  {"uf":"PE","nome":"Pernambuco"},
  {"uf":"PI","nome":"Piauí"},
  {"uf":"RJ","nome":"Rio de Janeiro"},
  {"uf":"RN","nome":"Rio Grande do Norte"},
  {"uf":"RS","nome":"Rio Grande do Sul"},
  {"uf":"RO","nome":"Rondônia"},
  {"uf":"RR","nome":"Roraima"},
  {"uf":"SC","nome":"Santa Catarina"},
  {"uf":"SP","nome":"São Paulo"},
  {"uf":"SE","nome":"Sergipe"},
  {"uf":"TO","nome":"Tocantins"},
];

const semAcento = (s) => String(s || "").trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const PORNOME = Object.fromEntries(ESTADOS.flatMap((e) => [[e.uf.toLowerCase(), e.uf], [semAcento(e.nome), e.uf]]));

// "Pernambuco", "pernambuco", "PE" -> "PE"
export function ufDe(texto) {
  return PORNOME[semAcento(texto)] || null;
}
