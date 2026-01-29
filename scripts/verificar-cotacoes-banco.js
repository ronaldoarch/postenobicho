const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function verificar() {
  try {
    console.log('=== VERIFICANDO COTAÇÕES NO BANCO ===\n')
    
    // Buscar todas as cotações
    const cotacoes = await prisma.cotacao.findMany({
      orderBy: { id: 'asc' },
    })
    
    console.log(`Total de cotações no banco: ${cotacoes.length}\n`)
    
    // Agrupar por modalidade
    const porModalidade = {}
    cotacoes.forEach(c => {
      if (!porModalidade[c.modalidade]) {
        porModalidade[c.modalidade] = []
      }
      porModalidade[c.modalidade].push({
        id: c.id,
        modalidade: c.modalidade,
        posicao: c.posicao,
        cotacao: c.cotacao,
        active: c.active,
      })
    })
    
    console.log('=== COTAÇÕES POR MODALIDADE ===\n')
    Object.keys(porModalidade).sort().forEach(mod => {
      console.log(`\n📊 ${mod}:`)
      porModalidade[mod].forEach(c => {
        console.log(`   ID ${c.id} | Posição ${c.posicao} | Cotação: ${c.cotacao} | Ativo: ${c.active}`)
      })
    })
    
    // Verificar especificamente Milhar Invertida
    console.log('\n\n=== VERIFICANDO MILHAR INVERTIDA ===')
    const milharInvertida = cotacoes.filter(c => c.modalidade === 'MILHAR_INVERTIDA')
    if (milharInvertida.length > 0) {
      console.log(`✅ Encontradas ${milharInvertida.length} cotações para MILHAR_INVERTIDA:`)
      milharInvertida.forEach(c => {
        console.log(`   Posição ${c.posicao}: ${c.cotacao}x`)
      })
    } else {
      console.log('❌ Nenhuma cotação encontrada para MILHAR_INVERTIDA')
    }
    
    // Verificar outras modalidades invertidas
    console.log('\n=== VERIFICANDO OUTRAS MODALIDADES INVERTIDAS ===')
    const invertidas = ['DEZENA_INVERTIDA', 'CENTENA_INVERTIDA']
    invertidas.forEach(mod => {
      const cotas = cotacoes.filter(c => c.modalidade === mod)
      console.log(`\n${mod}:`)
      if (cotas.length > 0) {
        cotas.forEach(c => {
          console.log(`   Posição ${c.posicao}: ${c.cotacao}x`)
        })
      } else {
        console.log('   ❌ Nenhuma cotação encontrada')
      }
    })
    
  } catch (error) {
    console.error('Erro:', error)
  } finally {
    await prisma.$disconnect()
  }
}

verificar()
