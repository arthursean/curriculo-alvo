-- Estrutura do banco. Rode com `npm run db:setup` (ou cole no SQL Editor do Neon).
-- Pode rodar mais de uma vez: só cria o que ainda não existe.

CREATE TABLE IF NOT EXISTS usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  senha_hash TEXT NOT NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Guardamos apenas o hash SHA-256 do token; o token em si só existe no cookie do usuário.
CREATE TABLE IF NOT EXISTS sessoes (
  token_hash TEXT PRIMARY KEY,
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  expira_em TIMESTAMPTZ NOT NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sessoes_usuario_idx ON sessoes (usuario_id);

CREATE TABLE IF NOT EXISTS recuperacoes_senha (
  token_hash TEXT PRIMARY KEY,
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  expira_em TIMESTAMPTZ NOT NULL,
  usado_em TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS recuperacoes_usuario_idx ON recuperacoes_senha (usuario_id);

-- Limite de tentativas (login, cadastro, recuperação) para dificultar ataques de força bruta.
CREATE TABLE IF NOT EXISTS tentativas (
  chave TEXT NOT NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS tentativas_chave_idx ON tentativas (chave, criado_em);

CREATE TABLE IF NOT EXISTS perfis (
  usuario_id UUID PRIMARY KEY REFERENCES usuarios(id) ON DELETE CASCADE,
  dados JSONB NOT NULL,
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS curriculos (
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  vaga_id TEXT NOT NULL,
  vaga JSONB NOT NULL,
  ajuste JSONB NOT NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (usuario_id, vaga_id)
);
