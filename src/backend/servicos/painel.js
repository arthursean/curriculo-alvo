import "server-only";
import * as eventos from "@/backend/repositorios/eventos";
import * as curriculos from "@/backend/repositorios/curriculos";
import * as candidaturas from "@/backend/repositorios/candidaturas";
import { obterPerfil } from "@/backend/servicos/perfil";
import { ErroApp } from "@/backend/http/erros";
import { AREAS } from "@/shared/vagas";

// Só o clique em "Ver vaga original" é registrado (lista de vagas visitadas do painel).
const TIPOS_DA_TELA = new Set(["link"]);
const AREAS_VALIDAS = new Set(AREAS.map((a) => a.id));
const MAX_POR_HORA = 600; // acima disso, ignora (protege o banco de cliques automatizados)

const texto = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : undefined);
const urlSegura = (u) => (typeof u === "string" && /^https?:\/\/[^\s"'<>]+$/i.test(u) && u.length <= 1000 ? u : undefined);

// Guarda só o necessário para o painel, com tamanho limitado.
function resumoDaVaga(vaga = {}) {
  const c = Number(vaga.compatibilidade);
  return {
    titulo: texto(vaga.titulo, 200),
    empresa: texto(vaga.empresa, 120),
    local: texto(vaga.local, 120),
    fonte: texto(vaga.fonte, 40),
    area: AREAS_VALIDAS.has(vaga.area) ? vaga.area : undefined,
    url: urlSegura(vaga.url),
    compatibilidade: Number.isFinite(c) ? Math.max(0, Math.min(100, Math.round(c))) : undefined,
  };
}

export async function registrarEvento(usuarioId, { tipo, vaga } = {}) {
  if (!TIPOS_DA_TELA.has(tipo)) throw new ErroApp("Evento inválido.");
  const vagaId = texto(vaga?.id, 200);
  if (!vagaId) throw new ErroApp("Informe a vaga.");
  if ((await eventos.contarUltimaHora(usuarioId)) >= MAX_POR_HORA) return;
  await eventos.registrar(usuarioId, tipo, vagaId, resumoDaVaga(vaga));
  if (Math.random() < 0.02) await eventos.apagarAntigos(usuarioId);
}

// Itens do perfil que mais pesam na personalização: vira a lista "o que falta".
function checklistDoPerfil(p) {
  const itens = [
    ["Nome e contato", Boolean(p.nome && (p.email || p.telefone))],
    ["Resumo profissional", (p.resumo || "").trim().length >= 80],
    ["Pelo menos 5 competências", (p.competencias || []).length >= 5],
    ["Experiência ou projeto", (p.experiencias || []).length > 0 || (p.projetos || []).length > 0],
    ["Descrições com resultados", (p.experiencias || []).some((e) => (e.descricao || "").split("\n").filter((l) => l.trim()).length >= 2)],
    ["Formação", (p.formacao || []).length > 0],
    ["Idiomas", (p.idiomas || []).length > 0],
    ["Cidade", Boolean((p.cidade || "").trim())],
  ];
  return itens.map(([nome, ok]) => ({ nome, ok }));
}

export async function painel(usuarioId) {
  const [cv, cand, compat, links, perfil] = await Promise.all([
    curriculos.resumo(usuarioId),
    candidaturas.resumo(usuarioId),
    candidaturas.compatibilidadeGeral(usuarioId),
    eventos.ultimosLinks(usuarioId),
    obterPerfil(usuarioId),
  ]);
  const checklist = checklistDoPerfil(perfil || {});
  return {
    curriculos: cv,
    candidaturas: cand,
    compatibilidade: compat, // { media, vagas }
    ultimosLinks: links.map((l) => ({ vagaId: l.vagaId, em: l.em, ...l.dados })),
    perfil: { checklist, completo: Math.round((checklist.filter((c) => c.ok).length / checklist.length) * 100), nome: perfil?.nome || "" },
  };
}
