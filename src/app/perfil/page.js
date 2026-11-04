"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import TagInput from "@/frontend/components/TagInput";
import MesAno from "@/frontend/components/MesAno";
import Autocompletar from "@/frontend/components/Autocompletar";
import SeletorLocal from "@/frontend/components/SeletorLocal";
import ImportarCurriculo from "@/frontend/components/ImportarCurriculo";
import EditorTexto from "@/frontend/components/EditorTexto";
import { IDIOMAS } from "@/shared/idiomas";
import { carregarPerfil, salvarPerfil } from "@/frontend/lib/api";
import { useProtegido } from "@/frontend/hooks/useProtegido";
import { novoId, perfilVazio } from "@/shared/perfil";

const NIVEIS_IDIOMA = ["Básico", "Intermediário", "Avançado", "Fluente", "Nativo"];
const STATUS_FORMACAO = ["Concluído", "Em andamento", "Trancado"];

// "Recife, PE" -> { cidade: "Recife", uf: "PE" }; textos antigos livres viram estado vazio.
function localDoPerfil(texto = "") {
  const m = String(texto).match(/^(.*),\s*([A-Z]{2})$/);
  return m ? { cidade: m[1].trim(), uf: m[2] } : { cidade: "", uf: "" };
}

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

      <ImportarCurriculo perfil={perfil} onAplicar={setPerfil} />

      <section className="card stack">
        <h2>Dados pessoais</h2>
        <div className="grid-2">
          <Campo rotulo="Nome completo"><input value={perfil.nome} onChange={set("nome")} placeholder="Maria Silva" /></Campo>
          <Campo rotulo="Título profissional"><input value={perfil.titulo} onChange={set("titulo")} placeholder="Analista de Dados" /></Campo>
          <Campo rotulo="E-mail"><input type="email" value={perfil.email} onChange={set("email")} /></Campo>
          <Campo rotulo="Telefone"><input type="tel" value={perfil.telefone} onChange={set("telefone")} placeholder="(11) 99999-0000" /></Campo>
          <div style={{ gridColumn: "1 / -1" }}>
            {/* Guardado como "Cidade, UF" (é como aparece no currículo). */}
            <SeletorLocal
              obrigatorioCidade
              uf={localDoPerfil(perfil.cidade).uf}
              cidade={localDoPerfil(perfil.cidade).cidade}
              onChange={({ uf, cidade }) => setPerfil((p) => ({ ...p, cidade: cidade ? `${cidade}, ${uf}` : uf ? `, ${uf}` : "" }))}
            />
          </div>
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
        <Campo rotulo="Soft skills (opcional)">
          <textarea
            value={perfil.softSkills || ""}
            onChange={set("softSkills")}
            placeholder="Perfil proativo, responsável com prazos e bom em trabalho em equipe. Aprendo novas tecnologias com facilidade."
            style={{ minHeight: 72 }}
          />
        </Campo>
        <p className="muted small" style={{ margin: 0 }}>No currículo, as competências técnicas aparecem em “Hard skills” e este texto em “Soft skills”. Sem texto, as competências comportamentais da lista (ex.: Liderança) vão para lá.</p>
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
              <Campo rotulo="Início"><MesAno valor={e.inicio} onChange={(v) => setLista("experiencias", e.id, "inicio", v)} /></Campo>
              <Campo rotulo="Fim"><MesAno valor={e.atual ? "" : e.fim} disabled={e.atual} onChange={(v) => setLista("experiencias", e.id, "fim", v)} /></Campo>
              <div style={{ alignSelf: "end", paddingBottom: 8 }}>
                <label className="check"><input type="checkbox" checked={e.atual} onChange={(ev) => setLista("experiencias", e.id, "atual", ev.target.checked)} /> Trabalho atual</label>
              </div>
            </div>
            <Campo rotulo="Atividades e resultados">
              <EditorTexto rotulo="Atividades e resultados" valor={e.descricao} onChange={(v) => setLista("experiencias", e.id, "descricao", v)} placeholder={"Criei dashboards que reduziram o tempo de fechamento em 30%\nAutomatizei relatórios semanais com Python"} />
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
          <div>
            <h2 style={{ margin: 0 }}>Projetos <span className="muted small" style={{ fontWeight: 400 }}>(opcional)</span></h2>
            <p className="muted small" style={{ margin: "2px 0 0" }}>Projetos pessoais, acadêmicos, freelas ou open source. Só aparecem no currículo se você cadastrar.</p>
          </div>
          <button className="btn sec sm" onClick={() => adicionar("projetos", { nome: "", link: "", inicio: "", fim: "", tecnologias: "", descricao: "" })}>+ Adicionar projeto</button>
        </div>
        {perfil.projetos.map((p) => (
          <div key={p.id} className="item stack">
            <div className="grid-2">
              <Campo rotulo="Nome do projeto"><input value={p.nome} onChange={(ev) => setLista("projetos", p.id, "nome", ev.target.value)} placeholder="App de controle financeiro" /></Campo>
              <Campo rotulo="Link (opcional)"><input value={p.link} onChange={(ev) => setLista("projetos", p.id, "link", ev.target.value)} placeholder="github.com/voce/projeto" /></Campo>
              <Campo rotulo="Início"><MesAno valor={p.inicio} onChange={(v) => setLista("projetos", p.id, "inicio", v)} /></Campo>
              <Campo rotulo="Fim (vazio se em andamento)"><MesAno valor={p.fim} onChange={(v) => setLista("projetos", p.id, "fim", v)} /></Campo>
            </div>
            <Campo rotulo="Tecnologias / ferramentas">
              <input value={p.tecnologias} onChange={(ev) => setLista("projetos", p.id, "tecnologias", ev.target.value)} placeholder="React, Node.js, PostgreSQL" />
            </Campo>
            <Campo rotulo="O que você fez e resultados">
              <EditorTexto rotulo="O que você fez no projeto" valor={p.descricao} onChange={(v) => setLista("projetos", p.id, "descricao", v)} placeholder={"Desenvolvi o app do zero, com login e gráficos de gastos\n200 usuários ativos no primeiro mês"} />
            </Campo>
            <div className="row">
              <button className="btn ghost sm" onClick={() => mover("projetos", p.id, -1)}>↑ Subir</button>
              <button className="btn ghost sm" onClick={() => mover("projetos", p.id, 1)}>↓ Descer</button>
              <button className="btn ghost sm" onClick={() => remover("projetos", p.id)}>Remover</button>
            </div>
          </div>
        ))}
      </section>

      <section className="card stack">
        <div className="row between">
          <h2 style={{ margin: 0 }}>Formação</h2>
          <button className="btn sec sm" onClick={() => adicionar("formacao", { curso: "", instituicao: "", inicio: "", fim: "", status: "Concluído", descricao: "" })}>+ Adicionar formação</button>
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
              <Campo rotulo="Início"><MesAno valor={f.inicio} onChange={(v) => setLista("formacao", f.id, "inicio", v)} /></Campo>
              <Campo rotulo="Conclusão (ou previsão)"><MesAno valor={f.fim} anosFuturos={8} onChange={(v) => setLista("formacao", f.id, "fim", v)} /></Campo>
              <div style={{ alignSelf: "end" }}><button className="btn ghost sm" onClick={() => remover("formacao", f.id)}>Remover</button></div>
            </div>
            <div style={{ marginTop: 12 }}>
              <Campo rotulo="Descrição (opcional)">
                <EditorTexto
                  rotulo="Descrição da formação"
                  valor={f.descricao || ""}
                  onChange={(v) => setLista("formacao", f.id, "descricao", v)}
                  placeholder={"TCC: análise de churn com Python e SQL (nota 10)\nDisciplinas: Estatística, Banco de Dados, Machine Learning\nMonitoria de Programação por 2 semestres"}
                  minimo={72}
                />
              </Campo>
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
            <Autocompletar
              style={{ flex: 2, minWidth: 160 }}
              valor={i.idioma}
              onChange={(v) => setLista("idiomas", i.id, "idioma", v)}
              // Não sugere idiomas que já estão em outras linhas.
              opcoes={IDIOMAS.filter((op) => op === i.idioma || !perfil.idiomas.some((x) => x.idioma === op))}
              placeholder="Digite: ing, esp, fra…"
            />
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
