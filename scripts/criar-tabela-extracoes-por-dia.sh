#!/bin/bash

# Script para criar a tabela ConfiguracaoExtracoesPorDia no servidor

cd /var/www/postenobicho

# Carregar variáveis de ambiente
source .env

# Criar tabela
mysql -u root -p"$DATABASE_PASSWORD" "$DATABASE_NAME" <<'SQL'
CREATE TABLE IF NOT EXISTS ConfiguracaoExtracoesPorDia (
  id INT AUTO_INCREMENT PRIMARY KEY,
  diaSemana INT NOT NULL COMMENT '0=Domingo, 1=Segunda, 2=Terça, 3=Quarta, 4=Quinta, 5=Sexta, 6=Sábado',
  extracaoId INT NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_dia_extracao (diaSemana, extracaoId),
  KEY idx_diaSemana (diaSemana),
  KEY idx_extracaoId (extracaoId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SHOW TABLES LIKE 'ConfiguracaoExtracoesPorDia';
SQL

echo "✅ Tabela criada (ou já existe)!"
