import { PrismaClient } from '@prisma/client'
import crypto from 'node:crypto'

const prisma = new PrismaClient()

const AUTH_SECRET = process.env.AUTH_SECRET || 'dev-secret'

function hashPassword(password: string) {
  return crypto.createHash('sha256').update(`${password}:${AUTH_SECRET}`).digest('hex')
}

async function resetAdminPassword() {
  try {
    const email = 'admin@postenobicho.com'
    const newPassword = process.argv[2] || 'admin123'
    
    console.log('🔐 Resetando senha do admin...')
    console.log(`Email: ${email}`)
    console.log(`AUTH_SECRET usado: ${AUTH_SECRET}`)
    console.log(`Nova senha: ${newPassword}`)
    
    // Verificar se usuário existe
    const user = await prisma.usuario.findUnique({
      where: { email },
    })
    
    if (!user) {
      console.error('❌ Usuário não encontrado!')
      process.exit(1)
    }
    
    // Gerar novo hash
    const passwordHash = hashPassword(newPassword)
    
    // Atualizar senha
    const updated = await prisma.usuario.update({
      where: { email },
      data: { passwordHash },
    })
    
    console.log('✅ Senha resetada com sucesso!')
    console.log(`   Nome: ${updated.nome}`)
    console.log(`   Email: ${updated.email}`)
    console.log(`   Hash gerado: ${passwordHash.substring(0, 20)}...`)
    console.log('')
    console.log('📝 Credenciais:')
    console.log(`   Email: ${email}`)
    console.log(`   Senha: ${newPassword}`)
  } catch (error: any) {
    console.error('❌ Erro ao resetar senha:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

resetAdminPassword()
