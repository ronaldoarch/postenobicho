-- Migration: Adiciona campos tipo e webhookUrl ao modelo Gateway
-- Adiciona índice em tipo e active para melhorar performance

ALTER TABLE `Gateway` 
  ADD COLUMN `tipo` VARCHAR(191) NOT NULL DEFAULT 'receba',
  ADD COLUMN `webhookUrl` VARCHAR(191) NULL;

-- Adicionar índice composto para buscar gateways por tipo e status
CREATE INDEX IF NOT EXISTS `Gateway_tipo_active_idx` ON `Gateway`(`tipo`, `active`);
