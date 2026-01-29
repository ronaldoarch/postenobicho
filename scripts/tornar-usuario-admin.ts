import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function tornarUsuarioAdmin() {
  try {
    // Pegar email do argumento ou usar padrão
    const email = process.argv[2]
    
    if (!email) {
      console.log('❌ Por favor, forneça o email do usuário')
      console.log('   Uso: npx tsx scripts/tornar-usuario-admin.ts email@exemplo.com')
      process.exit(1)
    }

    console.log(`🔍 Procurando usuário: ${email}...`)

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

    if (usuario.admin) {
      console.log(`✅ Usuário ${email} já é administrador!`)
      process.exit(0)
    }

    console.log(`🔧 Tornando ${email} administrador...`)
    
    await prisma.usuario.update({
      where: { id: usuario.id },
      data: { admin: true },
    })

    console.log(`✅ Usuário ${email} agora é administrador!`)
    console.log(`   Nome: ${usuario.nome}`)
    console.log(`   Email: ${usuario.email}`)
    console.log(`   Admin: ✅ SIM`)
    
    // Listar todos os admins
    const admins = await prisma.usuario.findMany({
      where: { admin: true },
      select: { email: true, nome: true },
    })
    
    console.log(`\n📊 Total de administradores: ${admins.length}`)
    admins.forEach(a => console.log(`   - ${a.email} (${a.nome})`))
    
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

tornarUsuarioAdmin()
