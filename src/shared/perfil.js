// Modelo do perfil, usado pelo frontend (formulários) e pelas regras de personalização.
export const perfilVazio = {
  nome: "",
  titulo: "",
  email: "",
  telefone: "",
  cidade: "",
  linkedin: "",
  site: "",
  resumo: "",
  competencias: [],
  experiencias: [],
  projetos: [], // opcional: { id, nome, link, inicio, fim, tecnologias, descricao }
  formacao: [],
  idiomas: [],
  certificacoes: [],
};

export const novoId = () => Math.random().toString(36).slice(2, 10);

export function perfilCompleto(p) {
  return Boolean(p?.nome && (p.competencias.length || p.experiencias.length));
}
