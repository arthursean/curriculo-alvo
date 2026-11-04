import "server-only";
import * as eventos from "@/backend/repositorios/eventos";
import * as curriculos from "@/backend/repositorios/curriculos";
import * as favoritos from "@/backend/repositorios/favoritos";
import { obterPerfil } from "@/backend/servicos/perfil";
import { ErroApp } from "@/backend/http/erros";
import { AREAS } from "@/shared/vagas";

// Tipos que a tela pode registrar. A busca é registrada pelo próprio servidor (rota de vagas).
const TIPOS_DA_TELA = new Set(["detalhes", "link", "pdf"]);
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
    fonte: texto(vaga.fonte, 40),
    area: AREAS_VALIDAS.has(vaga.area) ? vaga.area : undefined,
    url: urlSegura(vaga.url),
    compatibilidade: Number.isFinite(c) ? Math.max(0, Math.min(100, Math.round(c))) : undefined,
  };
}

async function gravar(usuarioId, tipo, vagaId, dados) {
  if ((await eventos.contarUltimaHora(usuarioId)) >= MAX_POR_HORA) return;
  await eventos.registrar(usuarioId, tipo, vagaId, dados);
  if (Math.random() < 0.02) await eventos.apagarAntigos(usuarioId);
}

export async function registrarEvento(usuarioId, { tipo, vaga } = {}) {
  if (!TIPOS_DA_TELA.has(tipo)) throw new ErroApp("Evento inválido.");
  const vagaId = texto(vaga?.id, 200);
  if (!vagaId) throw new ErroApp("Informe a vaga.");
  await gravar(usuarioId, tipo, vagaId, resumoDaVaga(vaga));
}

// Chamado pela busca de vagas. Uma falha aqui nunca derruba a busca.
export async function registrarBusca(usuarioId, { termos, uf, cidade, raio, total }) {
  try {
    await gravar(usuarioId, "busca", null, {
      termos: (termos || []).map((t) => texto(t, 80)).filter(Boolean).slice(0, 6),
      uf: texto(uf, 2), cidade: texto(cidade, 80), raio: Number(raio) || 0, total: Number(total) || 0,
    });
  } catch (e) {
    console.error("registrarBusca:", e?.message);
  }
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

function serieDiaria(linhas, dias = 30) {
  const mapa = new Map(linhas.map((l) => [l.dia, l.vagas]));
  const hoje = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
  const out = [];
  for (let i = dias - 1; i >= 0; i--) {
    const d = new Date(hoje);
    d.setDate(d.getDate() - i);
    const chave = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    out.push({ dia: chave, vagas: mapa.get(chave) || 0 });
  }
  return out;
}

export async function painel(usuarioId) {
  const [totais, porDia, areas, termos, links, cv, favTotal, favRecentes, perfil] = await Promise.all([
    eventos.totaisPorTipo(usuarioId),
    eventos.vagasPorDia(usuarioId, 30),
    eventos.areasAbertas(usuarioId),
    eventos.termosBuscados(usuarioId),
    eventos.ultimosLinks(usuarioId),
    curriculos.resumo(usuarioId),
    favoritos.contar(usuarioId),
    favoritos.recentes(usuarioId),
    obterPerfil(usuarioId),
  ]);
  const t = Object.fromEntries(totais.map((x) => [x.tipo, x]));
  const zero = { total: 0, ultimos30: 0, vagas: 0, vagas30: 0 };
  const checklist = checklistDoPerfil(perfil || {});
  return {
    buscas: t.busca || zero,
    detalhes: t.detalhes || zero,
    links: t.link || zero,
    pdfs: t.pdf || zero,
    curriculos: cv,
    favoritos: { total: favTotal, recentes: favRecentes },
    porDia: serieDiaria(porDia, 30),
    areas,
    termos,
    ultimosLinks: links.map((l) => ({ vagaId: l.vagaId, em: l.em, ...l.dados })),
    perfil: { checklist, completo: Math.round((checklist.filter((c) => c.ok).length / checklist.length) * 100), nome: perfil?.nome || "" },
  };
}
