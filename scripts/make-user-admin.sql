-- Script para tornar o usuário admin@postenobicho.com em admin
-- Execute este script no MySQL

-- 1. Adicionar coluna 'admin' à tabela Usuario se não existir
SET @dbname = DATABASE();
SET @tablename = 'Usuario';
SET @columnname = 'admin';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' BOOLEAN DEFAULT FALSE')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- 2. Tornar o usuário admin@postenobicho.com em admin
UPDATE Usuario 
SET admin = TRUE 
WHERE email = 'admin@postenobicho.com';

-- 3. Verificar se foi atualizado
SELECT id, nome, email, admin 
FROM Usuario 
WHERE email = 'admin@postenobicho.com';
