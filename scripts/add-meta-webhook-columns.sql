-- Adicionar colunas do Meta Pixel e Webhook à tabela Configuracao
-- Execute este script no banco de dados MySQL do servidor

-- Verificar e adicionar colunas se não existirem
ALTER TABLE Configuracao 
ADD COLUMN IF NOT EXISTS metaPixelId VARCHAR(255) NULL,
ADD COLUMN IF NOT EXISTS metaAccessToken TEXT NULL,
ADD COLUMN IF NOT EXISTS metaPixelEnabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS webhookUrl VARCHAR(500) NULL,
ADD COLUMN IF NOT EXISTS webhookEnabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS webhookEvents TEXT NULL,
ADD COLUMN IF NOT EXISTS webhookSecret VARCHAR(255) NULL;
