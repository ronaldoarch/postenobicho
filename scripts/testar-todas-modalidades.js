/**
 * Script para testar todas as modalidades e identificar possíveis erros
 */

const { contarPermutacoesDistintas } = require('./test-helpers')

// Simular funções do bet-rules-engine
function calcularValorUnitario(valorPorPalpite, unidades) {
  if (unidades === 0) return 0
  return valorPorPalpite / unidades
}

function calcularNumero(modalidade, numero, pos_from, pos_to, valorPalpite) {
  const qtdPosicoes = pos_to - pos_from + 1
  const invertida = modalidade.includes('INVERTIDA')
  
  let combinations = 1
  let valorParaCalcular = valorPalpite
  
  if (invertida) {
    combinations = contarPermutacoesDistintas(numero)
    valorParaCalcular = valorPalpite / combinations
  }
  
  const units = combinations * qtdPosicoes
  const unitValue = valorParaCalcular / qtdPosicoes
  
  return { combinations, positions: qtdPosicoes, units, unitValue }
}

function calcularGrupo(modalidade, qtdGruposPalpite, pos_from, pos_to, valorPalpite) {
  const qtdPosicoes = pos_to - pos_from + 1
  const combinations = 1
  const units = combinations * qtdPosicoes
  const unitValue = calcularValorUnitario(valorPalpite, units)
  
  return { combinations, positions: qtdPosicoes, units, unitValue }
}

const oddsTable = {
  DEZENA: { '1-1': 60, '1-3': 60, '1-5': 60, '1-7': 60 },
  CENTENA: { '1-1': 600, '1-3': 600, '1-5': 600, '1-7': 600 },
  MILHAR: { '1-1': 5000, '1-3': 5000, '1-5': 5000 },
  MILHAR_INVERTIDA: { '1-1': 200, '1-3': 200, '1-5': 200 },
  CENTENA_INVERTIDA: { '1-1': 600, '1-3': 600, '1-5': 600, '1-7': 600 },
  DEZENA_INVERTIDA: { '1-1': 60, '1-3': 60, '1-5': 60, '1-7': 60 },
  GRUPO: { '1-1': 18, '1-3': 18, '1-5': 18, '1-7': 18 },
  DUPLA_GRUPO: { '1-1': 180, '1-3': 180, '1-5': 180, '1-7': 180 },
  TERNO_GRUPO: { '1-1': 1800, '1-3': 1800, '1-5': 1800, '1-7': 1800 },
  QUADRA_GRUPO: { '1-1': 5000, '1-3': 5000, '1-5': 5000, '1-7': 5000 },
  QUINA_GRUPO: { '1-1': 5000, '1-3': 5000, '1-5': 5000, '1-7': 5000 },
  MILHAR_CENTENA: { '1-1': 3300, '1-3': 3300, '1-5': 3300 },
  TERNO_GRUPO_SECO: { '1-1': 150, '1-3': 150, '1-5': 150, '1-7': 150 },
}

function buscarOdd(modalidade, pos_from, pos_to) {
  const posKey = `${pos_from}-${pos_to}`
  const modalidadeOdds = oddsTable[modalidade]
  if (!modalidadeOdds) return 0
  return modalidadeOdds[posKey] || modalidadeOdds['1-5'] || 0
}

console.log('=== TESTE COMPLETO DE TODAS AS MODALIDADES ===\n')

// Teste 1: Dezena
console.log('1. DEZENA')
const calc1 = calcularNumero('DEZENA', '27', 1, 5, 2.00)
const odd1 = buscarOdd('DEZENA', 1, 5)
console.log('  Valor por palpite: R$ 2,00')
console.log('  Posições: 1-5 (5 posições)')
console.log('  Valor unitário:', calc1.unitValue.toFixed(4))
console.log('  Odd:', odd1)
console.log('  Prêmio mínimo (1 posição):', (calc1.unitValue * odd1).toFixed(2))
console.log('  Prêmio máximo (5 posições):', (calc1.unitValue * odd1 * 5).toFixed(2))
console.log('  ✅ Esperado mínimo: R$ 24,00 | Máximo: R$ 120,00')
console.log('')

// Teste 2: Dezena Invertida
console.log('2. DEZENA INVERTIDA')
const calc2 = calcularNumero('DEZENA_INVERTIDA', '27', 1, 5, 2.00)
const odd2 = buscarOdd('DEZENA_INVERTIDA', 1, 5)
console.log('  Valor por palpite: R$ 2,00')
console.log('  Variações:', calc2.combinations)
console.log('  Valor por variação:', (2.00 / calc2.combinations).toFixed(2))
console.log('  Valor unitário:', calc2.unitValue.toFixed(4))
console.log('  Odd:', odd2)
console.log('  Prêmio mínimo (1 posição):', (calc2.unitValue * odd2).toFixed(2))
console.log('  Prêmio máximo (5 posições):', (calc2.unitValue * odd2 * 5).toFixed(2))
console.log('')

// Teste 3: Centena Invertida
console.log('3. CENTENA INVERTIDA')
const calc3 = calcularNumero('CENTENA_INVERTIDA', '384', 1, 5, 2.00)
const odd3 = buscarOdd('CENTENA_INVERTIDA', 1, 5)
console.log('  Valor por palpite: R$ 2,00')
console.log('  Variações:', calc3.combinations)
console.log('  Valor por variação:', (2.00 / calc3.combinations).toFixed(4))
console.log('  Valor unitário:', calc3.unitValue.toFixed(4))
console.log('  Odd:', odd3)
console.log('  Prêmio mínimo (1 posição):', (calc3.unitValue * odd3).toFixed(2))
console.log('  Prêmio máximo (5 posições):', (calc3.unitValue * odd3 * 5).toFixed(2))
console.log('')

// Teste 4: Milhar Invertida
console.log('4. MILHAR INVERTIDA')
const calc4 = calcularNumero('MILHAR_INVERTIDA', '1234', 1, 5, 2.00)
const odd4 = buscarOdd('MILHAR_INVERTIDA', 1, 5)
console.log('  Valor por palpite: R$ 2,00')
console.log('  Variações:', calc4.combinations)
console.log('  Valor por variação:', (2.00 / calc4.combinations).toFixed(4))
console.log('  Valor unitário:', calc4.unitValue.toFixed(4))
console.log('  Odd:', odd4)
console.log('  Prêmio mínimo (1 posição):', (calc4.unitValue * odd4).toFixed(2))
console.log('  Prêmio máximo (5 posições):', (calc4.unitValue * odd4 * 5).toFixed(2))
console.log('')

// Teste 5: Grupo
console.log('5. GRUPO')
const calc5 = calcularGrupo('GRUPO', 1, 1, 5, 2.00)
const odd5 = buscarOdd('GRUPO', 1, 5)
console.log('  Valor por palpite: R$ 2,00')
console.log('  Posições: 1-5 (5 posições)')
console.log('  Valor unitário:', calc5.unitValue.toFixed(4))
console.log('  Odd:', odd5)
console.log('  Prêmio mínimo (1 posição):', (calc5.unitValue * odd5).toFixed(2))
console.log('  Prêmio máximo (5 posições):', (calc5.unitValue * odd5 * 5).toFixed(2))
console.log('')

// Teste 6: Milhar/Centena
console.log('6. MILHAR/CENTENA')
const calc6 = calcularNumero('MILHAR_CENTENA', '1234', 1, 5, 2.00)
const odd6 = buscarOdd('MILHAR_CENTENA', 1, 5)
console.log('  Valor por palpite: R$ 2,00')
console.log('  Posições: 1-5 (5 posições)')
console.log('  Valor unitário:', calc6.unitValue.toFixed(4))
console.log('  Odd:', odd6)
console.log('  Prêmio mínimo (1 posição):', (calc6.unitValue * odd6).toFixed(2))
console.log('  Prêmio máximo (5 posições):', (calc6.unitValue * odd6 * 5).toFixed(2))
console.log('')

console.log('=== VERIFICAÇÃO DE INCONSISTÊNCIAS ===\n')

// Verificar se há modalidades sem odds
const modalidades = [
  'DEZENA', 'CENTENA', 'MILHAR', 'MILHAR_INVERTIDA', 'CENTENA_INVERTIDA',
  'DEZENA_INVERTIDA', 'GRUPO', 'DUPLA_GRUPO', 'TERNO_GRUPO', 'QUADRA_GRUPO',
  'QUINA_GRUPO', 'MILHAR_CENTENA', 'TERNO_GRUPO_SECO'
]

modalidades.forEach(mod => {
  const odd = buscarOdd(mod, 1, 5)
  if (odd === 0) {
    console.log(`⚠️  ${mod}: Odd não encontrada para posições 1-5`)
  }
})

console.log('\n=== TESTE COMPLETO ===')
