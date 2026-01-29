const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function diagnostico() {
  console.log('=== 🔍 Diagnóstico do Dashboard ===\n')

  // 1. Verificar usuários
  console.log('1️⃣ Verificando total de usuários...')
  const totalUsuarios = await prisma.usuario.count()
  console.log('Total de usuários:', totalUsuarios)
  
  const comSaldo = await prisma.usuario.count({ 
    where: { saldo: { gt: 0 } } 
  })
  console.log('Usuários com saldo > 0:', comSaldo)
  
  const usuarios = await prisma.usuario.findMany({ 
    select: { id: true, nome: true, saldo: true },
    take: 5 
  })
  console.log('Primeiros 5 usuários:', JSON.stringify(usuarios, null, 2))
  console.log('')

  // 2. Verificar depósitos
  console.log('2️⃣ Verificando transações de depósito...')
  const depositos = await prisma.transacao.findMany({
    where: { tipo: 'deposito' },
    select: { id: true, valor: true, status: true, createdAt: true },
    take: 10
  })
  console.log('Total de depósitos encontrados:', depositos.length)
  console.log('Depósitos:', JSON.stringify(depositos, null, 2))
  
  const depositosPagos = await prisma.transacao.findMany({
    where: { 
      tipo: 'deposito',
      status: { in: ['aprovado', 'pago', 'paid'] }
    },
    select: { id: true, valor: true, status: true },
  })
  console.log('Depósitos pagos/aprovados:', depositosPagos.length)
  const totalDepositos = depositosPagos.reduce((sum, d) => sum + Number(d.valor || 0), 0)
  console.log('Total de depósitos:', totalDepositos)
  console.log('')

  // 3. Verificar apostas
  console.log('3️⃣ Verificando apostas...')
  const apostas = await prisma.aposta.findMany({
    select: { id: true, valor: true, status: true, createdAt: true },
    take: 10
  })
  console.log('Total de apostas encontradas:', apostas.length)
  console.log('Apostas:', JSON.stringify(apostas, null, 2))
  const totalApostas = apostas.reduce((sum, a) => sum + Number(a.valor || 0), 0)
  console.log('Total de apostas:', totalApostas)
  console.log('')

  // 4. Verificar saques
  console.log('4️⃣ Verificando saques...')
  const saques = await prisma.saque.findMany({
    select: { id: true, valor: true, status: true, createdAt: true, referenciaExterna: true },
    take: 10
  })
  console.log('Total de saques encontrados:', saques.length)
  console.log('Saques:', JSON.stringify(saques, null, 2))
  console.log('')

  await prisma.$disconnect()
  console.log('=== ✅ Diagnóstico Concluído ===')
}

diagnostico().catch(console.error)
