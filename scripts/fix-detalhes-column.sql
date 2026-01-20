-- Script para alterar a coluna detalhes de VARCHAR para TEXT
-- Execute este script no MySQL

USE admin_postenobicho;

-- Alterar coluna detalhes para TEXT (suporta até 65KB)
ALTER TABLE Aposta MODIFY COLUMN detalhes TEXT;

-- Verificar se a alteração foi aplicada
SHOW COLUMNS FROM Aposta WHERE Field = 'detalhes';
