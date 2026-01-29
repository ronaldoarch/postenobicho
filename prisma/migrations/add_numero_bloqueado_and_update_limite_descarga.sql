-- Migration: Adicionar tabela NumeroBloqueado e atualizar LimiteDescarga
-- Data: 2026-01-21
-- Descrição: Adiciona suporte para bloqueio automático de números específicos (milhar/centena/dezena)
--            quando atingem limite definido por modalidade + prêmio + extração

-- 1. Adicionar campos loteria e horario em LimiteDescarga (se não existirem)
SET @col_exists_loteria = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'LimiteDescarga' 
  AND COLUMN_NAME = 'loteria'
);

SET @sql_loteria = IF(@col_exists_loteria = 0,
  'ALTER TABLE LimiteDescarga ADD COLUMN loteria VARCHAR(255) NOT NULL DEFAULT ""',
  'SELECT "Coluna loteria já existe" AS message'
);

PREPARE stmt_loteria FROM @sql_loteria;
EXECUTE stmt_loteria;
DEALLOCATE PREPARE stmt_loteria;

SET @col_exists_horario = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'LimiteDescarga' 
  AND COLUMN_NAME = 'horario'
);

SET @sql_horario = IF(@col_exists_horario = 0,
  'ALTER TABLE LimiteDescarga ADD COLUMN horario VARCHAR(255) NOT NULL DEFAULT ""',
  'SELECT "Coluna horario já existe" AS message'
);

PREPARE stmt_horario FROM @sql_horario;
EXECUTE stmt_horario;
DEALLOCATE PREPARE stmt_horario;

-- 2. Remover constraint único antigo (se existir) e criar novo com loteria e horario
-- Nota: MySQL não suporta DROP CONSTRAINT diretamente, então vamos usar uma abordagem diferente
-- Primeiro, vamos verificar se o constraint existe e depois recriar

-- 3. Criar índices para loteria e horario
CREATE INDEX IF NOT EXISTS LimiteDescarga_loteria_horario_premio_idx ON LimiteDescarga(loteria, horario, premio);

-- 4. Criar tabela NumeroBloqueado
CREATE TABLE IF NOT EXISTS NumeroBloqueado (
  id INT AUTO_INCREMENT PRIMARY KEY,
  modalidade VARCHAR(255) NOT NULL,
  premio INT NOT NULL,
  numero VARCHAR(10) NOT NULL,
  loteria VARCHAR(255) NOT NULL DEFAULT "",
  horario VARCHAR(255) NOT NULL DEFAULT "",
  valorAtual DECIMAL(10, 2) NOT NULL,
  limite DECIMAL(10, 2) NOT NULL,
  bloqueadoEm DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_numero_extracao_premio (modalidade, premio, numero, loteria, horario),
  INDEX idx_modalidade_premio_loteria_horario (modalidade, premio, loteria, horario),
  INDEX idx_numero (numero)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Atualizar registros existentes para ter loteria e horario vazios (limite geral)
UPDATE LimiteDescarga 
SET loteria = "", horario = "" 
WHERE loteria IS NULL OR horario IS NULL;

-- 6. Remover constraint único antigo se existir (modalidade_premio)
-- Nota: Isso pode falhar se o constraint não existir, mas não é crítico
SET @constraint_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
  WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'LimiteDescarga' 
  AND CONSTRAINT_NAME = 'LimiteDescarga_modalidade_premio_key'
);

SET @sql_drop_constraint = IF(@constraint_exists > 0,
  'ALTER TABLE LimiteDescarga DROP INDEX LimiteDescarga_modalidade_premio_key',
  'SELECT "Constraint não existe" AS message'
);

PREPARE stmt_drop FROM @sql_drop_constraint;
EXECUTE stmt_drop;
DEALLOCATE PREPARE stmt_drop;

-- 7. Criar novo constraint único com loteria e horario
-- Nota: Vamos usar um nome específico para evitar conflitos
SET @constraint_new_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
  WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'LimiteDescarga' 
  AND CONSTRAINT_NAME = 'LimiteDescarga_modalidade_premio_loteria_horario_key'
);

SET @sql_add_constraint = IF(@constraint_new_exists = 0,
  'ALTER TABLE LimiteDescarga ADD UNIQUE KEY LimiteDescarga_modalidade_premio_loteria_horario_key (modalidade, premio, loteria, horario)',
  'SELECT "Constraint já existe" AS message'
);

PREPARE stmt_add FROM @sql_add_constraint;
EXECUTE stmt_add;
DEALLOCATE PREPARE stmt_add;
