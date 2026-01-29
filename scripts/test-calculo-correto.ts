/**
 * Teste para entender o cálculo correto
 * 
 * Exemplo:
 * - Modalidade: Grupo
 * - Posição: 1º ao 5º (5 posições)
 * - Palpites: 4 grupos
 * - Valor por palpite: R$ 10,00
 * 
 * Esperado pelo usuário:
 * - Mínimo: R$ 36,00 (1 palpite ganhando em 1 posição)
 * - Máximo: R$ 180,00 (1 palpite ganhando em todas as 5 posições)
 */

import { calcularGrupo, buscarOdd } from '@/lib/bet-rules-engine'

const modalidade = 'GRUPO'
const pos_from = 1
const pos_to = 5
const qtdGrupos = 1
const valorPorPalpite = 10.00
const qtdPalpites = 4

console.log('=== 🧪 Teste de Cálculo CORRETO ===\n')
console.log('Dados:')
console.log(`  Modalidade: ${modalidade}`)
console.log(`  Posições: ${pos_from}º ao ${pos_to}º (${pos_to - pos_from + 1} posições)`)
console.log(`  Palpites: ${qtdPalpites}`)
console.log(`  Valor por palpite: R$ ${valorPorPalpite.toFixed(2)}\n`)

const calculation = calcularGrupo(modalidade as any, qtdGrupos, pos_from, pos_to, valorPorPalpite)
const odd = buscarOdd(modalidade as any, pos_from, pos_to)
const premioUnidade = odd * calculation.unitValue

console.log('Cálculo base:')
console.log(`  Unidades por palpite: ${calculation.units}`)
console.log(`  Valor unitário: R$ ${calculation.unitValue.toFixed(2)}`)
console.log(`  Odd: ${odd}x`)
console.log(`  Prêmio por unidade: R$ ${premioUnidade.toFixed(2)}\n`)

// CÁLCULO POR PALPITE (não pelo total)
console.log('📊 CÁLCULO POR PALPITE:')
console.log(`  Cada palpite pode ganhar em 1 até ${calculation.positions} posições\n`)

// Mínimo: 1 palpite ganhando em 1 posição
const retornoMinimoPorPalpite = premioUnidade * 1
console.log('📉 MÍNIMO (1 palpite ganhando em 1 posição):')
console.log(`  Prêmio por unidade: R$ ${premioUnidade.toFixed(2)}`)
console.log(`  Posições ganhas: 1`)
console.log(`  Retorno: R$ ${premioUnidade.toFixed(2)} × 1 = R$ ${retornoMinimoPorPalpite.toFixed(2)}`)

// Máximo: 1 palpite ganhando em todas as posições
const retornoMaximoPorPalpite = premioUnidade * calculation.positions
console.log(`\n📈 MÁXIMO (1 palpite ganhando em todas as ${calculation.positions} posições):`)
console.log(`  Prêmio por unidade: R$ ${premioUnidade.toFixed(2)}`)
console.log(`  Posições ganhas: ${calculation.positions}`)
console.log(`  Retorno: R$ ${premioUnidade.toFixed(2)} × ${calculation.positions} = R$ ${retornoMaximoPorPalpite.toFixed(2)}`)

console.log(`\n✅ RESULTADO ESPERADO:`)
console.log(`  Mínimo: R$ ${retornoMinimoPorPalpite.toFixed(2)}`)
console.log(`  Máximo: R$ ${retornoMaximoPorPalpite.toFixed(2)}`)

// Verificação
if (Math.abs(retornoMinimoPorPalpite - 36.00) < 0.01 && Math.abs(retornoMaximoPorPalpite - 180.00) < 0.01) {
  console.log(`\n✅ CÁLCULO CORRETO!`)
} else {
  console.log(`\n❌ CÁLCULO INCORRETO!`)
  console.log(`  Esperado: Mínimo R$ 36,00, Máximo R$ 180,00`)
}
