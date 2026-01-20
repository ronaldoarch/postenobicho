-- Migration: Adicionar campos completos à tabela Cotacao
-- Data: 2025-01-17

-- Adicionar novos campos
ALTER TABLE `Cotacao` 
  ADD COLUMN `modalidadeId` INT NULL,
  ADD COLUMN `extracaoId` INT NULL,
  ADD COLUMN `promocaoId` INT NULL,
  ADD COLUMN `isSpecial` BOOLEAN NOT NULL DEFAULT FALSE;

-- Criar índices
CREATE INDEX `Cotacao_modalidadeId_idx` ON `Cotacao`(`modalidadeId`);
CREATE INDEX `Cotacao_extracaoId_idx` ON `Cotacao`(`extracaoId`);
CREATE INDEX `Cotacao_promocaoId_idx` ON `Cotacao`(`promocaoId`);
CREATE INDEX `Cotacao_isSpecial_active_idx` ON `Cotacao`(`isSpecial`, `active`);

-- Adicionar foreign keys
ALTER TABLE `Cotacao` 
  ADD CONSTRAINT `Cotacao_modalidadeId_fkey` 
    FOREIGN KEY (`modalidadeId`) REFERENCES `Modalidade`(`id`) 
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `Cotacao` 
  ADD CONSTRAINT `Cotacao_extracaoId_fkey` 
    FOREIGN KEY (`extracaoId`) REFERENCES `Extracao`(`id`) 
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `Cotacao` 
  ADD CONSTRAINT `Cotacao_promocaoId_fkey` 
    FOREIGN KEY (`promocaoId`) REFERENCES `Promocao`(`id`) 
    ON DELETE SET NULL ON UPDATE CASCADE;
