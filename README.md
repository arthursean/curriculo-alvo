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

O passo a passo completo, incluindo publicação no GitHub e no Vercel, está em [TUTORIAL-VERCEL.md](TUTORIAL-VERCEL.md).

## Como funciona a personalização

Arquivo `lib/personalizar.js`, executado no navegador:

1. Extrai da vaga as competências pedidas, usando um dicionário com sinônimos em português e inglês mais as competências do próprio perfil.
2. Dá peso a cada uma: mais peso se aparece no título, em "requisitos" ou várias vezes; menos peso em "diferenciais".
3. Cruza com o perfil para calcular a compatibilidade, ordenar competências, experiências e tópicos, e apontar lacunas, idiomas exigidos e diferença de senioridade.
4. Monta o resumo com fatos do perfil. Nada é inventado.

## Fontes de vagas

| Fonte | Chave | Observação |
|---|---|---|
| Adzuna | `ADZUNA_APP_ID`, `ADZUNA_APP_KEY` | Vagas do Brasil |
| Remotive | não precisa | Vagas remotas internacionais |
| Arbeitnow | não precisa | Vagas internacionais |

## Stack

Next.js 16, Postgres (Neon), envio de e-mail pelo Resend. Nenhuma chave fica no código: tudo vem de variáveis de ambiente (veja `.env.example`).
