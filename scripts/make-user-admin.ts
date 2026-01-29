import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function makeUserAdmin() {
  try {
    const email = 'admin@postenobicho.com'
    
    console.log('👤 Tornando usuário admin@postenobicho.com em admin...')
    
    // Verificar se usuário existe
    const user = await prisma.usuario.findUnique({
      where: { email },
    })
    
    if (!user) {
      console.error('❌ Usuário não encontrado!')
      process.exit(1)
    }
    
    // Atualizar usuário para admin
    const updated = await prisma.usuario.update({
      where: { email },
      data: { admin: true },
    })
    
    console.log('✅ Usuário atualizado com sucesso!')
    console.log(`   Nome: ${updated.nome}`)
    console.log(`   Email: ${updated.email}`)
    console.log(`   Admin: ${updated.admin}`)
  } catch (error: any) {
    // Se o campo admin não existir, tentar adicionar via SQL
    if (error.message?.includes('Unknown column') || error.message?.includes('admin')) {
      console.log('⚠️  Campo admin não existe. Execute primeiro: npx prisma db push')
      console.error('Erro:', error.message)
      process.exit(1)
    } else {
      console.error('❌ Erro ao atualizar usuário:', error)
      process.exit(1)
    }
  } finally {
    await prisma.$disconnect()
  }
}

makeUserAdmin()
