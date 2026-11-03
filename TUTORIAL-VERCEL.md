# Colocando o Currículo Alvo no ar: tutorial para quem nunca fez deploy

Ao final você terá:

- o código num **repositório público no GitHub**, sem nenhuma senha ou chave;
- o site funcionando num endereço como `https://curriculo-alvo.vercel.app`;
- um banco de dados guardando as contas, com as senhas protegidas;
- o e-mail de "esqueci minha senha" funcionando.

Tempo: cerca de 1 hora na primeira vez. Custo: **R$ 0**, porque todos os serviços abaixo têm plano gratuito e não é preciso cadastrar cartão.

---

## Parte 0 — Entendendo as peças (leia uma vez)

| Peça | O que é | Analogia |
|---|---|---|
| **Git** | Programa que registra versões do código ("commits") | Um "salvar como" com histórico |
| **GitHub** | Site que guarda o repositório Git na internet | Um Google Drive para código |
| **Vercel** | Serviço que pega o código do GitHub e coloca o site no ar | A gráfica que imprime e distribui |
| **Neon** | Banco de dados Postgres na nuvem: guarda contas, perfis e currículos | O arquivo de fichas |
| **Resend** | Serviço que envia e-mails pelo site | Os Correios |
| **Variáveis de ambiente** | Senhas e chaves que o site precisa, guardadas **fora** do código | O cofre |

**Por que o repositório pode ser público com segurança?** O código não tem nenhuma senha. As senhas ficam em dois lugares que nunca vão para o GitHub:

1. o arquivo `.env.local` no seu computador, que o Git ignora de propósito;
2. a tela **Environment Variables** do Vercel.

O banco de dados com os usuários fica no Neon, que também não é o GitHub.

---

## Parte 1 — Preparar o computador

### 1.1 Instalar o Node.js

1. Acesse https://nodejs.org e baixe a versão **LTS**.
2. Instale clicando em "Next" até o fim.
3. Abra um terminal (no Windows: menu Iniciar → digite **PowerShell** → Enter) e confira:

```bash
node -v
```

Deve aparecer algo como `v22.x.x` ou maior.

### 1.2 Git

Você já tem o Git instalado. Para conferir:

```bash
git --version
```

### 1.3 Abrir o terminal na pasta do projeto

Todos os comandos deste tutorial devem ser rodados **dentro da pasta do projeto**:

```bash
cd C:\Users\sonar\Coding\curriculo-alvo
```

### 1.4 Instalar as dependências do projeto

```bash
npm install
```

Esse comando baixa as bibliotecas que o site usa para a pasta `node_modules`. Pode levar 1 ou 2 minutos. Avisos amarelos (`warn`) são normais; só se preocupe com `ERR!` em vermelho.

---

## Parte 2 — Criar o banco de dados (Neon)

### 2.1 Criar a conta e o projeto

1. Acesse https://neon.tech e clique em **Sign up**. Entrar com a conta do GitHub é o mais fácil.
2. Crie um projeto:
   - **Nome:** `curriculo-alvo`
   - **Postgres version:** a que vier marcada
   - **Region:** **AWS South America East 1 (São Paulo)**, que é mais rápida para usuários no Brasil

> **Se aparecer a pergunta "what else does your app need?" com a opção Better Auth: desmarque a Better Auth** (selecione a opção e aperte **Espaço** até o `[x]` virar `[ ]`) e continue só com o Postgres. O Currículo Alvo já tem um sistema de login próprio, com hash de senha e recuperação por e-mail. Um segundo sistema de login iria conflitar com ele.

### 2.2 Copiar o endereço do banco (connection string)

1. No painel do projeto no Neon, clique em **Connect**.
2. Copie o texto que começa com `postgresql://...`. Ele é parecido com:
   `postgresql://neondb_owner:SENHA@ep-algo-123.sa-east-1.aws.neon.tech/neondb?sslmode=require`

⚠️ Esse texto **contém a senha do banco**. Nunca cole em chats, prints, issues ou no código. Ele só vai no `.env.local` e no Vercel.

### 2.3 (Recomendado) Criar um banco separado para testes

No Neon, vá em **Branches → New branch** e crie uma branch chamada `dev`. Ela é uma cópia separada do banco:

- use a branch **`dev`** no seu computador, para testar à vontade;
- use a branch **`main`** no site de verdade (produção).

Cada branch tem a sua connection string: troque a branch no seletor da tela **Connect** antes de copiar.

---

## Parte 3 — Testar no seu computador

### 3.1 Criar o arquivo de segredos `.env.local`

```bash
copy .env.example .env.local
```

Abra o arquivo `.env.local` no VS Code ou no Bloco de Notas e preencha:

```
DATABASE_URL=postgresql://... (connection string da branch dev)
APP_URL=http://localhost:3000
```

Deixe o resto em branco por enquanto.

### 3.2 Criar as tabelas no banco

```bash
npm run db:setup
```

Deve aparecer: `Banco pronto (9 comandos executados).`

### 3.3 Ligar o site

```bash
npm run dev
```

Abra http://localhost:3000 no navegador e teste:

1. **Criar conta** com seu e-mail e uma senha (pelo menos 8 caracteres, com letras e números).
2. Preencha o **Meu perfil**: nome, competências e uma experiência.
3. Vá em **Buscar vagas**, digite `react` ou `marketing` e clique em **Buscar**.
4. Clique em **Gerar currículo para esta vaga**.
5. Clique em **Sair** e depois em **Entrar → Esqueci minha senha**. Como o Resend ainda não está configurado, o link de redefinição aparece **no terminal** onde o `npm run dev` está rodando. Copie o link, abra no navegador e troque a senha.

Se tudo funcionou, o site está pronto para ir ao ar. Para desligar o servidor local, aperte `Ctrl + C` no terminal.

---

## Parte 4 — Configurar o e-mail (Resend)

1. Acesse https://resend.com e crie a conta com o **mesmo e-mail** que você usa para testar.
2. Vá em **API Keys → Create API Key**:
   - **Name:** `curriculo-alvo`
   - **Permission:** *Sending access*
3. Copie a chave, que começa com `re_`. Ela só aparece uma vez; se perder, é só criar outra.
4. Coloque no `.env.local`:

```
RESEND_API_KEY=re_...
EMAIL_FROM=Currículo Alvo <onboarding@resend.dev>
```

**Limitação do plano sem domínio:** o remetente de teste `onboarding@resend.dev` **só entrega e-mails para o endereço da sua própria conta Resend**. Isso basta para testar. Para enviar a qualquer usuário você precisa de um domínio (por exemplo `meusite.com.br`, cerca de R$ 40/ano no Registro.br):

1. No Resend, clique em **Domains → Add Domain**.
2. Cadastre no seu provedor de domínio os registros DNS que o Resend mostrar.
3. Aguarde a verificação, que leva de minutos a algumas horas.
4. Troque o remetente para `EMAIL_FROM=Currículo Alvo <nao-responda@meusite.com.br>`.

---

## Parte 5 — Publicar o código no GitHub (público)

### 5.1 Criar o repositório vazio

1. Entre em https://github.com e clique no **+** (canto superior direito) → **New repository**.
2. Preencha:
   - **Repository name:** `curriculo-alvo`
   - Marque **Public**
   - **Não** marque "Add a README", nem ".gitignore", nem "license"
3. Clique em **Create repository**.

### 5.2 Conferir que nenhum segredo vai junto

Rode:

```bash
git status
```

O `.env.local` **não pode aparecer** na lista. Para ter certeza, rode também:

```bash
git check-ignore .env.local
```

Se a resposta for `.env.local`, ele está protegido e o Git vai ignorá-lo. ✅

### 5.3 Enviar

O projeto já tem um commit pronto. Troque `SEU-USUARIO` pelo seu usuário do GitHub:

```bash
git remote add origin https://github.com/SEU-USUARIO/curriculo-alvo.git
```

```bash
git push -u origin main
```

Na primeira vez, o Windows abre uma janela pedindo para entrar no GitHub: faça o login no navegador. Depois, atualize a página do repositório e os arquivos estarão lá.

### 5.4 Ligar o "detector de segredos" do GitHub

No repositório, vá em **Settings → Code security** (ou *Advanced Security*) e ative:

- **Secret scanning**: avisa se alguma chave aparecer no código;
- **Push protection**: bloqueia o envio se você tentar subir uma chave por engano.

---

## Parte 6 — Colocar o site no ar (Vercel)

### 6.1 Importar o projeto

1. Acesse https://vercel.com e clique em **Sign up → Continue with GitHub**. Escolha o plano **Hobby** (grátis).
2. Clique em **Add New… → Project**.
3. Na lista, encontre `curriculo-alvo` e clique em **Import**. Se o repositório não aparecer, clique em *Adjust GitHub App Permissions* e libere o acesso a ele.
4. O Vercel detecta **Next.js** sozinho. Não mexa em *Build Command* nem em *Output Directory*.

### 6.2 Cadastrar as variáveis de ambiente (o "cofre")

Ainda nessa tela, abra **Environment Variables** e adicione uma por uma (**Key** = nome, **Value** = valor, depois **Add**):

| Key | Value |
|---|---|
| `DATABASE_URL` | connection string da branch **main** do Neon (a de produção, não a `dev`) |
| `RESEND_API_KEY` | a chave `re_...` |
| `EMAIL_FROM` | `Currículo Alvo <onboarding@resend.dev>` (ou o remetente do seu domínio) |
| `APP_URL` | deixe para o passo 6.4 |

Opcional, para buscar **vagas do Brasil**: crie uma conta grátis em https://developer.adzuna.com e adicione `ADZUNA_APP_ID` e `ADZUNA_APP_KEY`.

### 6.3 Deploy

Clique em **Deploy** e espere 1 a 2 minutos. Quando aparecer 🎉 *Congratulations*, clique na imagem do site para abrir. Anote o endereço, algo como `https://curriculo-alvo.vercel.app` ou `https://curriculo-alvo-xyz.vercel.app`.

### 6.4 Ajustar o `APP_URL`

O `APP_URL` é o endereço usado no link do e-mail de recuperação de senha.

1. No Vercel, abra o projeto → **Settings → Environment Variables**.
2. Adicione `APP_URL` = o endereço anotado, **sem barra no final**. Exemplo: `https://curriculo-alvo.vercel.app`.
3. Vá em **Deployments** → nos **três pontinhos** do deploy mais recente → **Redeploy**.

> Sempre que você criar ou mudar uma variável, faça um **Redeploy**: o site só "enxerga" as variáveis no momento em que é construído.

### 6.5 Criar as tabelas no banco de produção

O banco da branch `main` ainda está vazio. Para criar as tabelas:

1. No Neon, abra o projeto → **SQL Editor**.
2. Confira se a branch selecionada no topo é **main**.
3. No VS Code, abra o arquivo `db/schema.sql`, copie **todo** o conteúdo e cole no SQL Editor.
4. Clique em **Run**. Deve aparecer uma mensagem de sucesso. Em **Tables** você verá `usuarios`, `sessoes`, `perfis` e as demais.

### 6.6 Testar em produção

No endereço do site, repita o roteiro da parte 3.3: criar conta, preencher o perfil, buscar vagas, gerar currículo e usar o "Esqueci minha senha". Desta vez o e-mail chega de verdade na sua caixa; confira o spam.

**Pronto: seu site está no ar.** 🚀

---

## Parte 7 — Atualizar o site depois

Toda vez que mudar algo no código:

```bash
git add .
```

```bash
git commit -m "Descreva a mudança"
```

```bash
git push
```

O Vercel percebe o push e publica a nova versão sozinho, em cerca de 1 minuto. Se der erro, o site continua na versão anterior: nada quebra para os usuários.

Se alguma atualização mudar o `db/schema.sql`, rode o arquivo de novo no SQL Editor do Neon. Ele só cria o que estiver faltando.

---

## Parte 8 — Domínio próprio (opcional)

1. Compre o domínio, por exemplo no https://registro.br.
2. No Vercel: projeto → **Settings → Domains** → digite o domínio → **Add**.
3. O Vercel mostra 1 ou 2 registros DNS. Cadastre-os no painel do Registro.br e aguarde a propagação, que pode levar algumas horas.
4. Atualize o `APP_URL` para o novo domínio e faça **Redeploy**.

---

## Checklist de segurança

- [ ] `.env.local` **não** aparece no GitHub. Abra o repositório no navegador e confira.
- [ ] Secret scanning e Push protection estão ativados no GitHub.
- [ ] Produção usa a branch `main` do Neon; o seu computador usa a branch `dev`.
- [ ] `APP_URL` no Vercel é o endereço real do site, com `https://`.
- [ ] Você testou o "Esqueci minha senha" em produção.

O que o próprio site já faz por você:

- senhas guardadas só como hash scrypt;
- sessão em cookie protegido;
- link de recuperação válido por 1 hora e de uso único;
- limite de tentativas de login;
- proteção contra ataques vindos de outros sites;
- opção de excluir a conta (LGPD).

### E se eu subir uma senha ou chave por engano?

Apagar o arquivo **não resolve**: a chave continua no histórico do Git. Faça isto imediatamente:

1. **Troque a chave no serviço**:
   - Neon: **Roles** → o usuário do banco → **Reset password**, depois copie a nova connection string;
   - Resend: apague a API key e crie outra.
2. Atualize o `.env.local` e as variáveis no Vercel, e faça **Redeploy**.

---

## Deu erro? Veja aqui

| Sintoma | Causa provável | Solução |
|---|---|---|
| `npm` não é reconhecido | Node.js não instalado ou terminal aberto antes da instalação | Instale o Node e **abra um novo** terminal |
| `npm run db:setup` diz "Defina DATABASE_URL" | `.env.local` não existe ou está vazio | Refaça a parte 3.1 |
| "Erro interno" ao criar conta | Tabelas não criadas ou `DATABASE_URL` errada | Parte 6.5; confira a variável e faça Redeploy |
| `git push` pede senha e falha | O GitHub não aceita a senha da conta no terminal | Use o login pelo navegador que o Windows abre, ou instale o GitHub Desktop |
| `remote origin already exists` | O comando já foi rodado antes | `git remote set-url origin https://github.com/SEU-USUARIO/curriculo-alvo.git` |
| E-mail de recuperação não chega | Remetente de teste só entrega para o seu e-mail; `APP_URL` ou chave erradas | Confira spam, o painel **Emails** do Resend e as variáveis; faça Redeploy |
| "Adzuna (Brasil): não configurada" | Variáveis da Adzuna ausentes | São opcionais; adicione-as e faça Redeploy |
| Deploy falhou no Vercel | Erro no código ou no build | **Deployments** → clique no deploy com erro → leia o **Build Log** |

Onde ver os erros do site em produção: Vercel → projeto → **Logs**.
