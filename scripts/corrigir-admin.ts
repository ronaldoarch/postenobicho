import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Função hashPassword (mesma lógica do lib/auth.ts)
function hashPassword(password: string): string {
  const AUTH_SECRET = process.env.AUTH_SECRET || 'dev-secret'
  const crypto = require('crypto')
  return crypto.createHash('sha256').update(`${password}:${AUTH_SECRET}`).digest('hex')
}

async function main() {
  try {
    console.log('🔍 Verificando usuários...\n')

    // 1. Verificar se admin@postenobicho.com existe
    let adminUser = await prisma.usuario.findUnique({
      where: { email: 'admin@postenobicho.com' },
    })

    if (!adminUser) {
      console.log('📝 Criando usuário admin@postenobicho.com...')
      adminUser = await prisma.usuario.create({
        data: {
          email: 'admin@postenobicho.com',
          nome: 'Administrador',
          passwordHash: hashPassword('admin123'),
          admin: true,
        },
      })
      console.log('✅ Usuário admin criado!')
      console.log('   Email: admin@postenobicho.com')
      console.log('   Senha: admin123')
    } else {
      console.log('✅ Usuário admin@postenobicho.com já existe')
    }

    // 2. Garantir que admin@postenobicho.com é admin
    if (!adminUser.admin) {
      console.log('🔧 Tornando admin@postenobicho.com administrador...')
      await prisma.usuario.update({
        where: { id: adminUser.id },
        data: { admin: true },
      })
      console.log('✅ Usuário agora é administrador!')
    } else {
      console.log('✅ Usuário já é administrador')
    }

    // 3. Tornar izamanuela54@outlook.com admin também (usuário atual logado)
    const testUser = await prisma.usuario.findUnique({
      where: { email: 'izamanuela54@outlook.com' },
    })

    if (testUser) {
      if (!testUser.admin) {
        console.log('\n🔧 Tornando izamanuela54@outlook.com administrador...')
        await prisma.usuario.update({
          where: { id: testUser.id },
          data: { admin: true },
        })
        console.log('✅ izamanuela54@outlook.com agora é administrador!')
      } else {
        console.log('\n✅ izamanuela54@outlook.com já é administrador')
      }
    } else {
      console.log('\n⚠️  Usuário izamanuela54@outlook.com não encontrado')
    }

    // 4. Listar todos os usuários e seus status de admin
    console.log('\n📋 Listando todos os usuários:')
    const allUsers = await prisma.usuario.findMany({
      select: {
        id: true,
        email: true,
        nome: true,
        admin: true,
      },
      orderBy: { id: 'asc' },
    })

    allUsers.forEach((u) => {
      const status = u.admin ? '✅ ADMIN' : '❌ Usuário'
      console.log(`   [${u.id}] ${u.email} (${u.nome}) - ${status}`)
    })

    // 5. Contar admins
    const adminCount = await prisma.usuario.count({
      where: { admin: true },
    })
    console.log(`\n📊 Total de administradores: ${adminCount}`)

  } catch (error) {
    console.error('❌ Erro:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
