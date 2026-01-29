const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function verificar() {
  console.log('=== Verificando Status dos Depósitos ===\n')
  
  // Buscar todos os depósitos com seus status
  const depositos = await prisma.transacao.findMany({
    where: { tipo: 'deposito' },
    select: { id: true, valor: true, status: true, createdAt: true },
    orderBy: { createdAt: 'desc' }
  })
  
  console.log('Total de depósitos:', depositos.length)
  console.log('\nStatus únicos encontrados:')
  const statusUnicos = [...new Set(depositos.map(d => d.status))]
  statusUnicos.forEach(status => {
    const count = depositos.filter(d => d.status === status).length
    const total = depositos
      .filter(d => d.status === status)
      .reduce((sum, d) => sum + Number(d.valor || 0), 0)
    console.log(`  ${status}: ${count} depósitos, Total: R$ ${total.toFixed(2)}`)
  })
  
  console.log('\nDepósitos por status:')
  depositos.forEach(d => {
    console.log(`  ID ${d.id}: R$ ${d.valor}, Status: "${d.status}", Data: ${d.createdAt}`)
  })
  
  // Verificar o que o dashboard está buscando
  console.log('\n=== O que o dashboard busca ===')
  const depositosPagos = await prisma.transacao.findMany({
    where: { 
      tipo: 'deposito',
      status: { in: ['aprovado', 'pago', 'paid'] }
    },
    select: { id: true, valor: true, status: true },
  })
  console.log('Depósitos com status "aprovado", "pago" ou "paid":', depositosPagos.length)
  const total = depositosPagos.reduce((sum, d) => sum + Number(d.valor || 0), 0)
  console.log('Total:', total)
  
  await prisma.$disconnect()
}

verificar().catch(console.error)
