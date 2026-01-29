/**
 * Teste para verificar o cálculo na confirmação
 * 
 * Dados da imagem:
 * - Modalidade: Grupo
 * - Palpites: 4 (01, 02, 03, 04)
 * - Posição: 1-5
 * - Valor: R$ 10,00 total
 * - Divisão: Para todo o palpite
 * 
 * Resultado mostrado na imagem:
 * - Mínimo: R$ 9,00
 * - Máximo: R$ 45,00
 * 
 * Resultado esperado:
 * - Mínimo: R$ 36,00
 * - Máximo: R$ 180,00
 */

import { calcularGrupo, buscarOdd, calcularValorPorPalpite } from '@/lib/bet-rules-engine'

const modalidade = 'GRUPO'
const pos_from = 1
const pos_to = 5
const qtdGrupos = 1
const valorTotal = 10.00
const qtdPalpites = 4
const divisionType = 'all'

console.log('=== 🧪 Teste de Cálculo na Confirmação ===\n')
console.log('Dados:')
console.log(`  Modalidade: ${modalidade}`)
console.log(`  Palpites: ${qtdPalpites}`)
console.log(`  Valor total: R$ ${valorTotal.toFixed(2)}`)
console.log(`  Divisão: ${divisionType}`)
console.log(`  Posição: ${pos_from}º-${pos_to}º\n`)

// Calcular valor por palpite
const valorPorPalpite = calcularValorPorPalpite(valorTotal, qtdPalpites, divisionType as any)
console.log(`Valor por palpite: R$ ${valorPorPalpite.toFixed(2)}`)

// Calcular unidades
const calculation = calcularGrupo(modalidade as any, qtdGrupos, pos_from, pos_to, valorPorPalpite)
console.log(`Unidades por palpite: ${calculation.units}`)
console.log(`Valor unitário: R$ ${calculation.unitValue.toFixed(2)}`)

// Buscar odd
const odd = buscarOdd(modalidade as any, pos_from, pos_to)
console.log(`Odd: ${odd}x`)

// Calcular prêmio por unidade
const premioUnidade = odd * calculation.unitValue
console.log(`Prêmio por unidade: R$ ${premioUnidade.toFixed(2)}`)

// Calcular mínimo e máximo
const minimo = premioUnidade * 1
const maximo = premioUnidade * calculation.positions

console.log(`\n✅ Resultado:`)
console.log(`  Mínimo: R$ ${minimo.toFixed(2)}`)
console.log(`  Máximo: R$ ${maximo.toFixed(2)}`)

console.log(`\n❌ Resultado mostrado na imagem:`)
console.log(`  Mínimo: R$ 9,00`)
console.log(`  Máximo: R$ 45,00`)

// Verificar se está usando valor total ao invés de valor por palpite
const premioUnidadeComValorTotal = odd * (valorTotal / calculation.units)
const minimoComValorTotal = premioUnidadeComValorTotal * 1
const maximoComValorTotal = premioUnidadeComValorTotal * calculation.positions

console.log(`\n🔍 Se usar valor total (ERRADO):`)
console.log(`  Valor unitário: R$ ${(valorTotal / calculation.units).toFixed(2)}`)
console.log(`  Prêmio por unidade: R$ ${premioUnidadeComValorTotal.toFixed(2)}`)
console.log(`  Mínimo: R$ ${minimoComValorTotal.toFixed(2)}`)
console.log(`  Máximo: R$ ${maximoComValorTotal.toFixed(2)}`)

if (Math.abs(minimoComValorTotal - 9.00) < 0.01 && Math.abs(maximoComValorTotal - 45.00) < 0.01) {
  console.log(`\n⚠️  PROBLEMA ENCONTRADO: Está usando valor total ao invés de valor por palpite!`)
}
