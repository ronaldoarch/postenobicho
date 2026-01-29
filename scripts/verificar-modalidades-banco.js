const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function verificar() {
  try {
    const modalidades = await prisma.modalidade.findMany({
      orderBy: { id: 'asc' },
    })
    
    console.log('=== MODALIDADES NO BANCO ===\n')
    modalidades.forEach(m => {
      console.log(`ID: ${m.id} | Nome: "${m.name}" | Ativo: ${m.active}`)
    })
    
    console.log('\n=== VERIFICANDO MILHAR INVERTIDA ===')
    const milharInvertida = modalidades.find(m => m.name.includes('Milhar Invertida'))
    if (milharInvertida) {
      console.log(`✅ Encontrada: ID ${milharInvertida.id}, Nome: "${milharInvertida.name}"`)
    } else {
      console.log('❌ Milhar Invertida não encontrada')
    }
    
    console.log('\n=== VERIFICANDO MILHAR/CENTENA ===')
    const milharCentena = modalidades.find(m => m.name.includes('Milhar/Centena') || m.name.includes('Milhar Centena'))
    if (milharCentena) {
      console.log(`✅ Encontrada: ID ${milharCentena.id}, Nome: "${milharCentena.name}"`)
    } else {
      console.log('❌ Milhar/Centena não encontrada')
    }
    
  } catch (error) {
    console.error('Erro:', error)
  } finally {
    await prisma.$disconnect()
  }
}

verificar()
