"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import TagInput from "@/components/TagInput";
import { carregarPerfil, salvarPerfil, novoId, perfilVazio, useProtegido } from "@/lib/cliente";

const NIVEIS_IDIOMA = ["Básico", "Intermediário", "Avançado", "Fluente", "Nativo"];
const STATUS_FORMACAO = ["Concluído", "Em andamento", "Trancado"];

function Campo({ rotulo, children }) {
  return <div><label>{rotulo}</label>{children}</div>;
}

export default function Perfil() {
  const { dados, erro } = useProtegido(carregarPerfil);
  const [perfil, setPerfil] = useState(perfilVazio);
  const [carregado, setCarregado] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (!dados) return;
    setPerfil(dados);
    setCarregado(true);
  }, [dados]);

  // Salva automaticamente na conta, um instante depois da última alteração.
  const [primeiro, setPrimeiro] = useState(true);
  useEffect(() => {
    if (!carregado) return;
    if (primeiro) return setPrimeiro(false);
    setStatus("Salvando…");
    const t = setTimeout(() => {
      salvarPerfil(perfil)
        .then(() => setStatus("✓ Salvo"))
        .catch((e) => setStatus(`Erro ao salvar: ${e.message}`));
    }, 800);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [perfil, carregado]);

  const set = (campo) => (e) => setPerfil((p) => ({ ...p, [campo]: e.target.value }));
  const setLista = (lista, id, campo, valor) =>
    setPerfil((p) => ({ ...p, [lista]: p[lista].map((x) => (x.id === id ? { ...x, [campo]: valor } : x)) }));
  const adicionar = (lista, item) => setPerfil((p) => ({ ...p, [lista]: [...p[lista], { id: novoId(), ...item }] }));
  const remover = (lista, id) => setPerfil((p) => ({ ...p, [lista]: p[lista].filter((x) => x.id !== id) }));
  const mover = (lista, id, dir) =>
    setPerfil((p) => {
      const arr = [...p[lista]];
      const i = arr.findIndex((x) => x.id === id);
      const j = i + dir;
      if (j < 0 || j >= arr.length) return p;
      [arr[i], arr[j]] = [arr[j], arr[i]];
      return { ...p, [lista]: arr };
    });

  if (erro) return <div className="alerta">{erro}</div>;
  if (!carregado) return <div className="vazio">Carregando…</div>;

  return (
    <div className="stack">
      <div className="row between">
        <div>
          <h1>Meu perfil</h1>
          <p className="muted" style={{ margin: 0 }}>Tudo é salvo automaticamente na sua conta. {status && <strong style={{ color: status.startsWith("Erro") ? "var(--danger)" : "var(--ok)" }}>{status}</strong>}</p>
        </div>
        <Link href="/curriculo" className="btn">Ver currículo base →</Link>
      </div>

      <section className="card stack">
        <h2>Dados pessoais</h2>
        <div className="grid-2">
          <Campo rotulo="Nome completo"><input value={perfil.nome} onChange={set("nome")} placeholder="Maria Silva" /></Campo>
          <Campo rotulo="Título profissional"><input value={perfil.titulo} onChange={set("titulo")} placeholder="Analista de Dados" /></Campo>
          <Campo rotulo="E-mail"><input type="email" value={perfil.email} onChange={set("email")} /></Campo>
          <Campo rotulo="Telefone"><input type="tel" value={perfil.telefone} onChange={set("telefone")} placeholder="(11) 99999-0000" /></Campo>
          <Campo rotulo="Cidade / Estado"><input value={perfil.cidade} onChange={set("cidade")} placeholder="São Paulo, SP" /></Campo>
          <Campo rotulo="LinkedIn"><input value={perfil.linkedin} onChange={set("linkedin")} placeholder="linkedin.com/in/seu-nome" /></Campo>
          <Campo rotulo="Site / portfólio"><input value={perfil.site} onChange={set("site")} /></Campo>
        </div>
        <Campo rotulo="Resumo profissional">
          <textarea value={perfil.resumo} onChange={set("resumo")} placeholder="Quem você é, o que faz bem e o que busca — 3 a 5 frases." />
        </Campo>
      </section>

      <section className="card stack">
        <h2>Competências</h2>
        <p className="muted small" style={{ margin: 0 }}>Ferramentas, tecnologias e habilidades. Separe por vírgula ou tecle Enter.</p>
        <TagInput valores={perfil.competencias} onChange={(v) => setPerfil((p) => ({ ...p, competencias: v }))} placeholder="Ex.: Excel, Power BI, SQL, Negociação" />
      </section>

      <section className="card stack">
        <div className="row between">
          <h2 style={{ margin: 0 }}>Experiências</h2>
          <button className="btn sec sm" onClick={() => adicionar("experiencias", { cargo: "", empresa: "", local: "", inicio: "", fim: "", atual: false, descricao: "" })}>+ Adicionar experiência</button>
        </div>
        {perfil.experiencias.length === 0 && <p className="muted" style={{ margin: 0 }}>Nenhuma experiência ainda.</p>}
        {perfil.experiencias.map((e) => (
          <div key={e.id} className="item stack">
            <div className="grid-3">
              <Campo rotulo="Cargo"><input value={e.cargo} onChange={(ev) => setLista("experiencias", e.id, "cargo", ev.target.value)} /></Campo>
              <Campo rotulo="Empresa"><input value={e.empresa} onChange={(ev) => setLista("experiencias", e.id, "empresa", ev.target.value)} /></Campo>
              <Campo rotulo="Local"><input value={e.local} onChange={(ev) => setLista("experiencias", e.id, "local", ev.target.value)} /></Campo>
              <Campo rotulo="Início"><input type="month" value={e.inicio} onChange={(ev) => setLista("experiencias", e.id, "inicio", ev.target.value)} /></Campo>
              <Campo rotulo="Fim"><input type="month" value={e.fim} disabled={e.atual} onChange={(ev) => setLista("experiencias", e.id, "fim", ev.target.value)} /></Campo>
              <div style={{ alignSelf: "end", paddingBottom: 8 }}>
                <label className="check"><input type="checkbox" checked={e.atual} onChange={(ev) => setLista("experiencias", e.id, "atual", ev.target.checked)} /> Trabalho atual</label>
              </div>
            </div>
            <Campo rotulo="Atividades e resultados (um por linha)">
              <textarea value={e.descricao} onChange={(ev) => setLista("experiencias", e.id, "descricao", ev.target.value)} placeholder={"Criei dashboards que reduziram o tempo de fechamento em 30%\nAutomatizei relatórios semanais com Python"} />
            </Campo>
            <div className="row">
              <button className="btn ghost sm" onClick={() => mover("experiencias", e.id, -1)}>↑ Subir</button>
              <button className="btn ghost sm" onClick={() => mover("experiencias", e.id, 1)}>↓ Descer</button>
              <button className="btn ghost sm" onClick={() => remover("experiencias", e.id)}>Remover</button>
            </div>
          </div>
        ))}
      </section>

      <section className="card stack">
        <div className="row between">
          <h2 style={{ margin: 0 }}>Formação</h2>
          <button className="btn sec sm" onClick={() => adicionar("formacao", { curso: "", instituicao: "", inicio: "", fim: "", status: "Concluído" })}>+ Adicionar formação</button>
        </div>
        {perfil.formacao.length === 0 && <p className="muted" style={{ margin: 0 }}>Nenhuma formação ainda.</p>}
        {perfil.formacao.map((f) => (
          <div key={f.id} className="item">
            <div className="grid-3">
              <Campo rotulo="Curso"><input value={f.curso} onChange={(ev) => setLista("formacao", f.id, "curso", ev.target.value)} placeholder="Bacharelado em Administração" /></Campo>
              <Campo rotulo="Instituição"><input value={f.instituicao} onChange={(ev) => setLista("formacao", f.id, "instituicao", ev.target.value)} /></Campo>
              <Campo rotulo="Situação">
                <select value={f.status} onChange={(ev) => setLista("formacao", f.id, "status", ev.target.value)}>
                  {STATUS_FORMACAO.map((s) => <option key={s}>{s}</option>)}
                </select>
              </Campo>
              <Campo rotulo="Início"><input type="month" value={f.inicio} onChange={(ev) => setLista("formacao", f.id, "inicio", ev.target.value)} /></Campo>
              <Campo rotulo="Conclusão (ou previsão)"><input type="month" value={f.fim} onChange={(ev) => setLista("formacao", f.id, "fim", ev.target.value)} /></Campo>
              <div style={{ alignSelf: "end" }}><button className="btn ghost sm" onClick={() => remover("formacao", f.id)}>Remover</button></div>
            </div>
          </div>
        ))}
      </section>

      <section className="card stack">
        <div className="row between">
          <h2 style={{ margin: 0 }}>Idiomas</h2>
          <button className="btn sec sm" onClick={() => adicionar("idiomas", { idioma: "", nivel: "Intermediário" })}>+ Adicionar idioma</button>
        </div>
        {perfil.idiomas.map((i) => (
          <div key={i.id} className="row">
            <input style={{ flex: 2, minWidth: 140, width: "auto" }} value={i.idioma} onChange={(ev) => setLista("idiomas", i.id, "idioma", ev.target.value)} placeholder="Inglês" />
            <select style={{ flex: 1, minWidth: 140, width: "auto" }} value={i.nivel} onChange={(ev) => setLista("idiomas", i.id, "nivel", ev.target.value)}>
              {NIVEIS_IDIOMA.map((n) => <option key={n}>{n}</option>)}
            </select>
            <button className="btn ghost sm" onClick={() => remover("idiomas", i.id)}>Remover</button>
          </div>
        ))}
      </section>

      <section className="card stack">
        <h2>Certificações e cursos</h2>
        <TagInput valores={perfil.certificacoes} onChange={(v) => setPerfil((p) => ({ ...p, certificacoes: v }))} placeholder="Ex.: Google Data Analytics (2024)" />
      </section>
    </div>
  );
}
