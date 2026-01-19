-- Migration: Adiciona campos para integração Nxgate no modelo Saque
-- Adiciona campos: chavePix, tipoChavePix, referenciaExterna, gatewayId
-- Adiciona índice em status

ALTER TABLE `Saque` 
  ADD COLUMN `chavePix` VARCHAR(191) NULL,
  ADD COLUMN `tipoChavePix` VARCHAR(191) NULL,
  ADD COLUMN `referenciaExterna` VARCHAR(191) NULL,
  ADD COLUMN `gatewayId` INT NULL;

-- Adicionar índice em status para melhorar performance nas consultas
CREATE INDEX IF NOT EXISTS `Saque_status_idx` ON `Saque`(`status`);
