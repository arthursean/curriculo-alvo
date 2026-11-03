# Currículo Alvo

Site para criar seu perfil profissional, gerar um currículo base, buscar vagas-alvo com filtros e gerar um currículo personalizado para cada vaga escolhida, com contas de usuário seguras.

- **Contas** (`/cadastrar`, `/entrar`, `/esqueci-senha`, `/conta`): senha com hash scrypt, sessão em cookie HttpOnly, recuperação de senha por e-mail, troca de senha e exclusão da conta.
- **Perfil** (`/perfil`): dados pessoais, resumo, competências, experiências, formação, idiomas e certificações, salvos na conta.
- **Currículo base** (`/curriculo`): pronto para imprimir ou salvar em PDF.
- **Busca de vagas** (`/vagas`): palavras-chave, cidade e data de publicação; filtros de modalidade (remoto, híbrido, presencial), nível do cargo e área.
- **Currículo por vaga** (`/personalizar`): algoritmo próprio, sem IA paga, que mostra compatibilidade, o que você atende, lacunas e dicas.
- **Currículos salvos** (`/meus-curriculos`).

## Rodar localmente

```bash
npm install
cp .env.example .env.local   # preencha DATABASE_URL
npm run db:setup
npm run dev
```

A organização do código (front, back e shared) está em [ARQUITETURA.md](ARQUITETURA.md). O passo a passo completo, incluindo publicação no GitHub e no Vercel, está em [TUTORIAL-VERCEL.md](TUTORIAL-VERCEL.md).

## Como funciona a personalização

Arquivo `src/shared/personalizar.js`, executado no navegador:

1. Extrai da vaga as skills pedidas usando a taxonomia própria de `src/shared/skills.js`: cerca de 250 skills com sinônimos em português e inglês e uma hierarquia (PostgreSQL → SQL → Banco de dados).
2. Dá peso a cada skill: mais peso se aparece no título, em "requisitos" ou várias vezes; menos peso em "diferenciais" e nas categorias genéricas.
3. Cruza com o perfil em três níveis:
   - **direto:** você tem a skill pedida;
   - **implícito:** você tem uma skill mais específica que a implica (PostgreSQL atende "SQL");
   - **parecido:** você tem uma skill irmã (a vaga pede MySQL e você tem PostgreSQL), que vale meio ponto.
4. Reescreve o currículo: título com as skills pedidas, resumo na linguagem da vaga ("SQL (PostgreSQL)"), competências e tópicos reordenados, anotações e palavras-chave em negrito. Nada é inventado.

## Tradução do currículo

O idioma de cada vaga é detectado automaticamente (pt, en, es, fr, de). O currículo pode ser traduzido sem custo:

1. **Tradutor embutido do navegador** (Chrome 138+): roda no aparelho, e nada sai do computador.
2. **MyMemory** (gratuito), chamado direto do navegador de cada usuário, com cota diária por usuário.

Títulos das seções, níveis de idioma e datas usam textos fixos; nomes de ferramentas (React, Git, Excel…) não são traduzidos.

InHire não tem busca geral de vagas: cada empresa tem a sua página própria (`empresa.inhire.app`).

## Fontes de vagas

| Fonte | Chave | Observação |
|---|---|---|
| Gupy | não precisa | Vagas do Brasil (API pública do portal, não oficial) |
| Sólides | não precisa | Vagas do Brasil (API pública do portal, não oficial; máx. 25 por página) |
| Adzuna | `ADZUNA_APP_ID`, `ADZUNA_APP_KEY` | Opcional, vagas do Brasil |
| Remotive | não precisa | Vagas remotas internacionais |
| Arbeitnow | não precisa | Vagas internacionais |

## Stack

Next.js 16, Postgres (Neon), envio de e-mail pelo Resend. Nenhuma chave fica no código: tudo vem de variáveis de ambiente (veja `.env.example`).
