-- Migration: Adicionar campo liquidacaoAutomatica na tabela Configuracao
-- Execute este SQL no banco de dados antes de fazer deploy
-- Compatível com MySQL

-- MySQL não suporta IF NOT EXISTS em ALTER TABLE, então verificamos antes
SET @col_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'Configuracao' 
  AND COLUMN_NAME = 'liquidacaoAutomatica'
);

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE Configuracao ADD COLUMN liquidacaoAutomatica BOOLEAN NOT NULL DEFAULT true',
  'SELECT "Coluna liquidacaoAutomatica já existe" AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Atualizar registros existentes para ter liquidação automática ativa por padrão
UPDATE Configuracao 
SET liquidacaoAutomatica = true 
WHERE liquidacaoAutomatica IS NULL;
