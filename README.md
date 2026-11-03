# Currículo Alvo

Site para criar seu perfil profissional, gerar um currículo base, buscar vagas-alvo com filtros e gerar um currículo personalizado para cada vaga escolhida, com contas de usuário seguras.

- **Contas** (`/cadastrar`, `/entrar`, `/esqueci-senha`, `/conta`): senha com hash scrypt, sessão em cookie HttpOnly, recuperação de senha por e-mail, troca de senha e exclusão da conta.
- **Perfil** (`/perfil`): dados pessoais, resumo, competências, experiências, projetos (opcional), formação, idiomas e certificações, salvos na conta.
- **Currículo base** (`/curriculo`): pronto para imprimir ou salvar em PDF.
- **Busca de vagas** (`/vagas`): palavras-chave, cidade e data de publicação; filtros de modalidade (remoto, híbrido, presencial), nível do cargo e área.
- **Currículo por vaga** (`/personalizar`): algoritmo próprio, sem IA paga, que mostra compatibilidade, o que você atende, lacunas e dicas.
- **Edição do currículo:** antes do PDF, dá para editar o texto e a formatação (negrito, itálico, sublinhado, listas) direto na folha. A versão editada fica salva e pode ser descartada.
- **Currículos salvos** (`/meus-curriculos`).

## Rodar localmente

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Crie um arquivo `.env.local` na raiz com as variáveis abaixo. Ele fica fora do Git: nunca suba esse arquivo.

   | Variável | Obrigatória | Para que serve |
   |---|---|---|
   | `DATABASE_URL` | sim | Connection string do Postgres (ex.: Neon), no formato `postgresql://usuario:senha@host/banco?sslmode=require` |
   | `APP_URL` | em produção | Endereço público do site, usado no link de recuperação de senha (ex.: `https://seu-site.vercel.app`) |
   | `RESEND_API_KEY` | em produção | Chave do [Resend](https://resend.com) para enviar o e-mail de recuperação. Sem ela, em desenvolvimento o link aparece no terminal |
   | `EMAIL_FROM` | não | Remetente do e-mail (padrão: `Currículo Alvo <onboarding@resend.dev>`) |
   | `ADZUNA_APP_ID`, `ADZUNA_APP_KEY` | não | Busca de vagas do Brasil pela Adzuna |

3. Rode o site:

   ```bash
   npm run dev
   ```

As tabelas do banco são criadas automaticamente no primeiro acesso. Se quiser criá-las antes, rode `npm run db:setup`.

Para publicar no Vercel, importe o repositório e cadastre as mesmas variáveis em **Settings → Environment Variables**.

A organização do código (front, back e shared) está em [ARQUITETURA.md](ARQUITETURA.md).

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

Next.js 16, Postgres (Neon), envio de e-mail pelo Resend. Nenhuma chave fica no código: tudo vem de variáveis de ambiente (veja [Rodar localmente](#rodar-localmente)).
