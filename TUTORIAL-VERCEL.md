# Como publicar o Currículo Alvo (GitHub público + Vercel)

Tempo estimado: 30 minutos. Custo: grátis (planos gratuitos de Vercel, Neon e Resend). Não há IA paga: a personalização usa um algoritmo próprio.

> **Regra de ouro:** o código vai para o GitHub público; **chaves e senhas nunca**. Elas ficam só no arquivo `.env.local` (no seu computador, ignorado pelo Git) e nas variáveis de ambiente do Vercel. O banco de dados fica no Neon, fora do GitHub.

---

## 1. O que você precisa

- **Node.js 20 ou mais novo**: https://nodejs.org (versão LTS)
- **Git**: https://git-scm.com
- Contas gratuitas: **GitHub** (https://github.com), **Vercel** (https://vercel.com, entre com o GitHub), **Neon** (https://neon.tech) e **Resend** (https://resend.com)

## 2. Criar o banco de dados (Neon)

1. Entre em https://console.neon.tech e clique em **New Project**. Escolha a região **São Paulo (aws-sa-east-1)** se aparecer.
2. Na tela do projeto, clique em **Connect** e copie a **connection string**. Ela começa com `postgresql://` e contém uma senha: trate-a como segredo.
3. (Recomendado) Crie dois bancos separados: use a branch `main` para produção e crie uma branch `dev` (**Branches → New branch**) para testar no seu computador. Cada uma tem a sua connection string.

## 3. Rodar no seu computador

Na pasta do projeto:

```bash
npm install
```

Copie o arquivo de exemplo de variáveis:

```bash
cp .env.example .env.local
```

Abra `.env.local` e preencha `DATABASE_URL` com a connection string da branch `dev`. Depois crie as tabelas:

```bash
npm run db:setup
```

E inicie o site:

```bash
npm run dev
```

Abra http://localhost:3000, crie uma conta e teste. Sem `RESEND_API_KEY`, o e-mail de recuperação de senha **não é enviado**: o link aparece no terminal onde o `npm run dev` está rodando.

## 4. Configurar o envio de e-mail (Resend)

1. Em https://resend.com, vá em **API Keys → Create API Key** (permissão *Sending access*) e copie a chave (`re_...`).
2. Sem domínio próprio, o Resend só envia a partir de `onboarding@resend.dev` e **apenas para o e-mail da sua conta Resend**: serve para testar.
3. Para enviar para qualquer usuário, verifique um domínio: **Domains → Add Domain**, cadastre os registros DNS que ele mostrar no seu provedor (ex.: Registro.br) e aguarde a verificação. Depois use, por exemplo, `EMAIL_FROM=Currículo Alvo <nao-responda@seudominio.com.br>`.

## 5. Publicar no GitHub (repositório público)

1. No GitHub, clique em **New repository**, nome `curriculo-alvo`, marque **Public** e clique em **Create repository** (sem README).
2. **Antes do primeiro envio, confira que nenhum segredo vai junto.** Este comando deve listar `.env.local` (ou seja, ele está sendo ignorado):

```bash
git check-ignore .env.local
```

3. Envie o código (troque `SEU-USUARIO`). O repositório já está iniciado e com o primeiro commit:

```bash
git remote add origin https://github.com/SEU-USUARIO/curriculo-alvo.git
```

```bash
git push -u origin main
```

4. No GitHub, abra **Settings → Code security** do repositório e ative **Secret scanning** e **Push protection**: o GitHub passa a bloquear envios que contenham chaves por engano.

## 6. Publicar no Vercel

1. Entre em https://vercel.com/new e importe o repositório `curriculo-alvo`. O Vercel detecta **Next.js** sozinho.
2. Em **Environment Variables**, cadastre:

| Variável | Valor |
|---|---|
| `DATABASE_URL` | connection string da branch `main` do Neon |
| `APP_URL` | o endereço final do site, ex.: `https://curriculo-alvo.vercel.app` (sem barra no fim) |
| `RESEND_API_KEY` | a chave `re_...` do Resend |
| `EMAIL_FROM` | `Currículo Alvo <onboarding@resend.dev>` ou o remetente do seu domínio |
| `ADZUNA_APP_ID` / `ADZUNA_APP_KEY` | opcionais, para vagas do Brasil (grátis em https://developer.adzuna.com) |

3. Clique em **Deploy**.
4. Crie as tabelas no banco de produção. Opção mais simples: no Neon, abra **SQL Editor** na branch `main`, cole todo o conteúdo do arquivo `db/schema.sql` e clique em **Run**.
5. Abra o site, crie sua conta e teste "Esqueci minha senha".

Mudou alguma variável depois? Vá em **Deployments**, clique nos três pontinhos do último deploy → **Redeploy**. Variáveis só valem para deploys feitos depois de salvas.

## 7. Atualizar o site

Cada `git push` na branch `main` publica uma nova versão:

```bash
git add .
```

```bash
git commit -m "Descreva a mudança"
```

```bash
git push
```

Se uma atualização mudar `db/schema.sql`, rode o arquivo de novo no SQL Editor do Neon (ele só cria o que falta).

## Como as contas são protegidas

- **Senhas**: guardadas só como hash **scrypt** com sal aleatório por usuário. Nem quem tem acesso ao banco consegue ver as senhas.
- **Sessões**: token aleatório num cookie `HttpOnly`, `Secure` e `SameSite=Lax`; no banco fica apenas o hash SHA-256 do token. Validade de 30 dias; "Sair" apaga a sessão.
- **Recuperação de senha**: link de uso único, válido por 1 hora, com o token guardado só como hash. Redefinir a senha desconecta todos os aparelhos. A resposta é sempre a mesma, exista ou não a conta, para não revelar quem é cadastrado.
- **Força bruta**: limite de tentativas por e-mail e por IP no login, cadastro e recuperação.
- **Outros**: checagem de origem contra CSRF, cabeçalhos de segurança (anti-clickjacking, nosniff), busca de vagas só para usuários logados, e o usuário pode trocar a senha ou excluir a conta e todos os dados em **Minha conta** (LGPD).

## Se uma chave vazar

Se você subir uma chave por engano, apagar o arquivo não resolve: ela fica no histórico do Git. **Gere uma nova chave e revogue a antiga** no serviço (Neon: **Roles → Reset password**; Resend: apague a API key) e atualize o `.env.local` e o Vercel.

## Problemas comuns

- **"Erro interno" ao entrar ou cadastrar**: `DATABASE_URL` ausente ou errada, ou as tabelas não foram criadas (passo 6.4). Veja **Deployments → (deploy) → Logs** no Vercel.
- **E-mail de recuperação não chega**: confira spam; sem domínio verificado, o Resend só entrega no e-mail da sua conta Resend; confira `APP_URL` e faça Redeploy. O painel do Resend (**Emails**) mostra cada envio.
- **"Adzuna (Brasil): não configurada"** na busca: faltam as variáveis da Adzuna ou o Redeploy.
- **Gerar o PDF**: no currículo, clique em **Imprimir / PDF** e escolha **Salvar como PDF**; em "Mais definições", desmarque "Cabeçalhos e rodapés".
