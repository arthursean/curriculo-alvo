// Estrutura do banco. Fonte única, usada em dois lugares:
//  - o site roda estes comandos sozinho no primeiro acesso ao banco (backend/db/cliente.js);
//  - `npm run db:setup` roda os mesmos comandos manualmente.
// Todos usam IF NOT EXISTS: rodar de novo só cria o que falta e nunca apaga dados.
// Para mudar a estrutura, acrescente comandos no fim da lista.

export const COMANDOS_SCHEMA = [
  `CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    nome TEXT NOT NULL,
    senha_hash TEXT NOT NULL,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,

  // Guardamos apenas o hash SHA-256 do token; o token em si só existe no cookie do usuário.
  `CREATE TABLE IF NOT EXISTS sessoes (
    token_hash TEXT PRIMARY KEY,
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    expira_em TIMESTAMPTZ NOT NULL,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS sessoes_usuario_idx ON sessoes (usuario_id)`,

  `CREATE TABLE IF NOT EXISTS recuperacoes_senha (
    token_hash TEXT PRIMARY KEY,
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    expira_em TIMESTAMPTZ NOT NULL,
    usado_em TIMESTAMPTZ
  )`,
  `CREATE INDEX IF NOT EXISTS recuperacoes_usuario_idx ON recuperacoes_senha (usuario_id)`,

  // Limite de tentativas (login, cadastro, recuperação) para dificultar ataques de força bruta.
  `CREATE TABLE IF NOT EXISTS tentativas (
    chave TEXT NOT NULL,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS tentativas_chave_idx ON tentativas (chave, criado_em)`,

  `CREATE TABLE IF NOT EXISTS perfis (
    usuario_id UUID PRIMARY KEY REFERENCES usuarios(id) ON DELETE CASCADE,
    dados JSONB NOT NULL,
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,

  `CREATE TABLE IF NOT EXISTS curriculos (
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    vaga_id TEXT NOT NULL,
    vaga JSONB NOT NULL,
    ajuste JSONB NOT NULL,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (usuario_id, vaga_id)
  )`,

  // Vagas favoritadas: guardamos a vaga inteira para mostrar mesmo sem refazer a busca.
  `CREATE TABLE IF NOT EXISTS favoritos (
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    vaga_id TEXT NOT NULL,
    vaga JSONB NOT NULL,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (usuario_id, vaga_id)
  )`,

  // Atividade do usuário para o painel inicial (buscas, vagas abertas, links clicados, PDFs).
  // Só do próprio usuário, apagada junto com a conta; registros com mais de 1 ano são removidos.
  `CREATE TABLE IF NOT EXISTS eventos (
    id BIGSERIAL PRIMARY KEY,
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL,
    vaga_id TEXT,
    dados JSONB,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS eventos_usuario_idx ON eventos (usuario_id, criado_em)`,
];
