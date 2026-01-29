-- Migration: Adicionar tabela UsuarioLocalizacao
-- Data: 2026-01-26

CREATE TABLE IF NOT EXISTS UsuarioLocalizacao (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuarioId INT NOT NULL,
  ip VARCHAR(45) NOT NULL,
  tipo VARCHAR(20) DEFAULT 'cadastro',
  latitude FLOAT NULL,
  longitude FLOAT NULL,
  cidade VARCHAR(255) NULL,
  estado VARCHAR(255) NULL,
  pais VARCHAR(255) NULL,
  regiao VARCHAR(255) NULL,
  timezone VARCHAR(100) NULL,
  isp VARCHAR(255) NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuarioId) REFERENCES Usuario(id) ON DELETE CASCADE,
  INDEX idx_usuarioId (usuarioId),
  INDEX idx_tipo (tipo),
  INDEX idx_createdAt (createdAt),
  INDEX idx_ip (ip)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
