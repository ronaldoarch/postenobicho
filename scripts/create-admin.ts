import { PrismaClient } from '@prisma/client'
import crypto from 'node:crypto'

const AUTH_SECRET = process.env.AUTH_SECRET || 'dev-secret'

function hashPassword(password: string) {
  return crypto.createHash('sha256').update(`${password}:${AUTH_SECRET}`).digest('hex')
}

const prisma = new PrismaClient()

async function createAdmin() {
  try {
    const email = process.argv[2] || 'admin@postenobicho.com'
    const password = process.argv[3] || 'admin123'
    const nome = process.argv[4] || 'Administrador'

    console.log('🔐 Criando usuário admin...')
    console.log(`Email: ${email}`)
    console.log(`Nome: ${nome}`)

    // Verificar se já existe
    const existing = await prisma.usuario.findUnique({
      where: { email },
    })

    if (existing) {
      console.log('⚠️  Usuário já existe! Atualizando senha...')
      const passwordHash = hashPassword(password)
      await prisma.usuario.update({
        where: { email },
        data: { passwordHash },
      })
      console.log('✅ Senha atualizada com sucesso!')
    } else {
      const passwordHash = hashPassword(password)
      await prisma.usuario.create({
        data: {
          nome,
          email,
          passwordHash,
          saldo: 0,
          bonus: 0,
          ativo: true,
        },
      })
      console.log('✅ Usuário admin criado com sucesso!')
    }

    console.log('\n📝 Credenciais:')
    console.log(`   Email: ${email}`)
    console.log(`   Senha: ${password}`)
    console.log('\n⚠️  IMPORTANTE: Altere a senha após o primeiro login!')
  } catch (error) {
    console.error('❌ Erro ao criar usuário admin:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

createAdmin()
