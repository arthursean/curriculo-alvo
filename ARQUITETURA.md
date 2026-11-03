# Arquitetura do Currículo Alvo

O projeto é um único app Next.js (um deploy só no Vercel), mas o código é dividido em camadas com regras claras de dependência. Assim, frontend e backend ficam separados sem a complexidade de dois servidores.

```
src/
├── app/                      Rotas do Next.js (só "cola": não tem regra de negócio)
│   ├── (páginas)/page.js     Telas: usam frontend/ e shared/
│   └── api/**/route.js       Controladores HTTP: leem a requisição, chamam um serviço, respondem
│
├── frontend/                 Roda no navegador
│   ├── components/           Componentes visuais (Nav, Curriculo, FormConta, MesAno, Autocompletar…)
│   ├── hooks/                useProtegido (páginas que exigem login)
│   ├── lib/api.js            Cliente da API — único lugar do frontend que chama o servidor
│   ├── lib/navegacao.js      Vaga escolhida entre telas, redirecionamento seguro
│   ├── lib/tradutor.js       Tradução do currículo (tradutor do navegador / MyMemory)
│   └── styles/globals.css
│
├── backend/                  Roda só no servidor (todo arquivo tem `import "server-only"`)
│   ├── servicos/             Regras de negócio, sem HTTP: autenticacao, conta, perfil, vagas
│   ├── repositorios/         Acesso ao banco, só SQL: usuarios, sessoes, recuperacoes, perfis, curriculos, tentativas
│   ├── db/                   Conexão (cliente.js, cria as tabelas no 1º acesso) e estrutura (schema.mjs)
│   ├── auth/                 Hash de senha (scrypt), sessão em cookie, limite de tentativas
│   ├── email/                Envio do e-mail de recuperação (Resend)
│   ├── http/                 lerJson, rota(), erros (ErroApp) — a ponte entre HTTP e serviços
│   └── vagas/fontes/         Uma fonte de vagas por arquivo: gupy, solides, adzuna, remotive, arbeitnow
│
└── shared/                   Lógica pura, sem acesso a rede/banco: roda nos dois lados
    ├── personalizar.js       Algoritmo de adaptação do currículo à vaga
    ├── skills.js             Taxonomia de skills (sinônimos + hierarquia)
    ├── vagas.js              Classificação de vaga (área, nível, modalidade, idioma)
    ├── traducao.js           Rótulos do currículo por idioma, detecção de idioma
    ├── perfil.js, idiomas.js, texto.js
```

## Regras de dependência

| Camada | Pode importar | Não pode importar |
|---|---|---|
| `shared/` | só `shared/` | `frontend/`, `backend/` |
| `frontend/` | `frontend/`, `shared/` | `backend/` |
| `backend/` | `backend/`, `shared/` | `frontend/` |
| `app/api/` | `backend/`, `shared/` | `frontend/` |
| `app/` (páginas) | `frontend/`, `shared/` | `backend/` |

`npm run checar` confere essas regras. Além disso, o `import "server-only"` em todo arquivo do backend faz o build falhar se algum código de servidor (SQL, chaves) for parar no navegador.

## Caminho de uma requisição

```
Tela (app/perfil/page.js)
  └─ frontend/lib/api.js           salvarPerfil(perfil)  →  PUT /api/perfil
       └─ app/api/perfil/route.js  exigirUsuario() + lerJson()
            └─ backend/servicos/perfil.js      valida
                 └─ backend/repositorios/perfis.js   INSERT … ON CONFLICT
```

Os serviços lançam `ErroApp("mensagem", status)` para erros esperados (senha errada, e-mail repetido…). O `rota()` de `backend/http` transforma isso em resposta JSON. Qualquer outro erro vira um 500 genérico, com o detalhe só no log do servidor.

## Como estender

- **Nova fonte de vagas:** crie `backend/vagas/fontes/minhafonte.js` exportando `nome` e `buscar(q, { local, dias })` no formato comum (veja `gupy.js`) e registre em `backend/servicos/vagas.js`.
- **Nova skill ou sinônimo:** edite `shared/skills.js` com `S("Nome", [sinônimos], [pais])`.
- **Nova rota:** controlador fino em `app/api/.../route.js` chamando um serviço, e função correspondente em `frontend/lib/api.js`.
- **Nova tabela:** acrescente o comando no fim de `backend/db/schema.mjs` (com `IF NOT EXISTS`) e crie o repositório. O site cria a tabela sozinho no próximo acesso (ou rode `npm run db:setup`).
