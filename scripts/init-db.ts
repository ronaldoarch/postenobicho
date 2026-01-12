import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function initDatabase() {
  try {
    console.log('🔄 Verificando e criando tabelas no banco de dados...')
    
    // Tenta fazer uma query simples para verificar se as tabelas existem
    // Se não existirem, o Prisma vai criar automaticamente com db push
    await prisma.$connect()
    
    // Verifica se a tabela Configuracao existe tentando fazer uma query
    try {
      await prisma.configuracao.findFirst()
      console.log('✅ Tabelas já existem no banco de dados')
    } catch (error: any) {
      if (error.code === 'P2021' || error.message?.includes('does not exist')) {
        console.log('📦 Criando tabelas no banco de dados...')
        // Executa db push para criar as tabelas
        const { execSync } = require('child_process')
        execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' })
        console.log('✅ Tabelas criadas com sucesso!')
      } else {
        throw error
      }
    }
  } catch (error) {
    console.error('❌ Erro ao inicializar banco de dados:', error)
    // Não falha a aplicação, apenas loga o erro
  } finally {
    await prisma.$disconnect()
  }
}

// Executa apenas se não estiver em modo de desenvolvimento
if (process.env.NODE_ENV !== 'development') {
  initDatabase().catch(console.error)
}

export default initDatabase
