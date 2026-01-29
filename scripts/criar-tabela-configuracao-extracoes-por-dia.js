const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function criarTabela() {
  try {
    console.log('🗄️ Criando tabela ConfiguracaoExtracoesPorDia...')
    
    // Usar Prisma para criar a tabela via SQL raw
    await prisma.$executeRaw`
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
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `
    
    console.log('✅ Tabela criada com sucesso!')
  } catch (error) {
    if (error.message.includes('already exists') || error.message.includes('Duplicate')) {
      console.log('ℹ️ Tabela já existe, continuando...')
    } else {
      console.error('❌ Erro ao criar tabela:', error)
      throw error
    }
  } finally {
    await prisma.$disconnect()
  }
}

criarTabela()
