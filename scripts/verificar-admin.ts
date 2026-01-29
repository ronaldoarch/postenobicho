import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function verificarAdmin() {
  try {
    const email = process.argv[2]
    
    if (!email) {
      console.log('❌ Por favor, forneça o email do usuário')
      console.log('   Uso: npx tsx scripts/verificar-admin.ts email@exemplo.com')
      process.exit(1)
    }

    console.log(`🔍 Verificando usuário: ${email}...\n`)

    const usuario = await prisma.usuario.findUnique({
      where: { email },
      select: {
        id: true,
        nome: true,
        email: true,
        admin: true,
      },
    })

    if (!usuario) {
      console.log(`❌ Usuário não encontrado: ${email}`)
      console.log('\n📋 Usuários disponíveis:')
      const usuarios = await prisma.usuario.findMany({
        select: { email: true, nome: true },
        take: 10,
      })
      usuarios.forEach(u => console.log(`   - ${u.email} (${u.nome})`))
      process.exit(1)
    }

    console.log(`📊 Status do usuário:`)
    console.log(`   Nome: ${usuario.nome}`)
    console.log(`   Email: ${usuario.email}`)
    console.log(`   Admin: ${usuario.admin ? '✅ SIM' : '❌ NÃO'}`)
    
    if (!usuario.admin) {
      console.log(`\n⚠️  Este usuário NÃO é administrador!`)
      console.log(`\n💡 Para tornar este usuário admin, execute:`)
      console.log(`   npx tsx scripts/tornar-usuario-admin.ts ${email}`)
    } else {
      console.log(`\n✅ Este usuário pode acessar o painel admin!`)
    }
    
  } catch (error: any) {
    console.error('❌ Erro:', error.message)
    if (error.message?.includes('admin')) {
      console.log('\n⚠️  Campo admin não existe no banco. Execute primeiro:')
      console.log('   npx prisma db push')
    }
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

verificarAdmin()
