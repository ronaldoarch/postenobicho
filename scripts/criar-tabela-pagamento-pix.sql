-- Criar tabela PagamentoPix se não existir
CREATE TABLE IF NOT EXISTS `PagamentoPix` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `chavePix` VARCHAR(255) NOT NULL,
  `nomeRecebedor` VARCHAR(255) NOT NULL,
  `valor` DOUBLE NOT NULL,
  `nota` TEXT,
  `adminId` INT NULL,
  `transactionId` VARCHAR(255) NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'pendente',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `PagamentoPix_createdAt_idx` (`createdAt`),
  INDEX `PagamentoPix_nomeRecebedor_idx` (`nomeRecebedor`),
  INDEX `PagamentoPix_transactionId_idx` (`transactionId`),
  INDEX `PagamentoPix_status_idx` (`status`),
  INDEX `PagamentoPix_adminId_idx` (`adminId`),
  FOREIGN KEY (`adminId`) REFERENCES `Usuario`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
