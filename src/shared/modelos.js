// Modelos visuais do currículo. Todos usam a mesma estrutura (só o CSS muda), então trocar de modelo
// mantém o conteúdo e a formatação (negrito etc.). A cor secundária vale para qualquer modelo.
export const MODELOS = [
  { id: "classico", nome: "Clássico", descricao: "Centralizado, títulos em destaque" },
  { id: "moderno", nome: "Moderno", descricao: "Coluna lateral com as skills" },
  { id: "minimalista", nome: "Minimalista", descricao: "Serifado, linhas finas" },
  { id: "executivo", nome: "Executivo", descricao: "Faixa colorida no topo" },
  { id: "compacto", nome: "Compacto", descricao: "Mais conteúdo em uma página" },
];

export const CORES = ["#0C343D", "#1F3A93", "#6B2D5C", "#1E6B52", "#8A3B12", "#333333"];

export const VISUAL_PADRAO = { modelo: "classico", cor: "#0C343D" };

// Aceita só modelos conhecidos e cores hex (#rgb / #rrggbb): o valor vai para o CSS da página.
export function visualValido(v) {
  const modelo = MODELOS.some((m) => m.id === v?.modelo) ? v.modelo : VISUAL_PADRAO.modelo;
  const cor = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v?.cor || "") ? v.cor : VISUAL_PADRAO.cor;
  return { modelo, cor };
}
