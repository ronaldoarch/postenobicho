// Script para testar busca de odd do banco
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testarBuscaOdd() {
  console.log('🔍 Testando busca de odd do banco...\n')
  
  // Buscar modalidade "Grupo" no banco
  const modalidade = await prisma.modalidade.findFirst({
    where: {
      name: 'Grupo',
      active: true,
    },
    select: {
      id: true,
      name: true,
      value: true,
      active: true,
    },
  })
  
  console.log('📊 Resultado da busca:')
  console.log(JSON.stringify(modalidade, null, 2))
  
  if (modalidade && modalidade.value) {
    // Testar extração do valor
    const match = modalidade.value.match(/R\$\s*([\d,]+(?:\.\d{2})?)/)
    if (match) {
      const valor = parseFloat(match[1].replace(',', '.'))
      console.log(`\n✅ Valor extraído: ${valor}`)
      console.log(`📌 Valor esperado: 20`)
      console.log(`🎯 Match: ${valor === 20 ? 'SIM ✅' : 'NÃO ❌'}`)
    } else {
      console.log('\n❌ Não foi possível extrair o valor')
      console.log(`Valor completo: "${modalidade.value}"`)
    }
  } else {
    console.log('\n❌ Modalidade não encontrada ou sem valor')
  }
  
  await prisma.$disconnect()
}

testarBuscaOdd().catch(console.error)
