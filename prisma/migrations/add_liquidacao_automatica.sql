-- Migration: Adicionar campo liquidacaoAutomatica na tabela Configuracao
-- Execute este SQL no banco de dados antes de fazer deploy

ALTER TABLE "Configuracao" 
ADD COLUMN IF NOT EXISTS "liquidacaoAutomatica" BOOLEAN NOT NULL DEFAULT true;

-- Atualizar registros existentes para ter liquidação automática ativa por padrão
UPDATE "Configuracao" 
SET "liquidacaoAutomatica" = true 
WHERE "liquidacaoAutomatica" IS NULL;
