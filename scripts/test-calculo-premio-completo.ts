/**
 * Script para testar o cálculo completo de premiação conforme exemplo fornecido
 * Incluindo verificação de divisão "all" vs "each"
 * 
 * Exemplo:
 * - Modalidade: Grupo
 * - Posição: 1º ao 5º
 * - Palpites: 4 grupos
 * - Valor por palpite: R$ 10,00
 * - Valor total: R$ 40,00
 * - Retorno previsto: R$ 144,00
 */

import { calcularGrupo, buscarOdd, calcularValorPorPalpite } from '@/lib/bet-rules-engine'

// Dados do exemplo
const modalidade = 'GRUPO'
const pos_from = 1
const pos_to = 5
const qtdGrupos = 1 // Grupo simples = 1 grupo por palpite
const valorTotal = 40.00
const qtdPalpites = 4
const divisionType = 'all' // 'all' = divide o valor entre todos os palpites

console.log('=== 🧪 Teste Completo de Cálculo de Premiação ===\n')
console.log('Dados da aposta:')
console.log(`  Modalidade: ${modalidade}`)
console.log(`  Posição: ${pos_from}º ao ${pos_to}º`)
console.log(`  Palpites: ${qtdPalpites} grupos`)
console.log(`  Valor total: R$ ${valorTotal.toFixed(2)}`)
console.log(`  Tipo de divisão: ${divisionType}`)
console.log(`  Retorno previsto esperado: R$ 144,00\n`)

// 1. Calcular valor por palpite baseado no tipo de divisão
const valorPorPalpite = calcularValorPorPalpite(valorTotal, qtdPalpites, divisionType as any)

console.log('1️⃣ Cálculo de valor por palpite:')
console.log(`  Valor total: R$ ${valorTotal.toFixed(2)}`)
console.log(`  Quantidade de palpites: ${qtdPalpites}`)
console.log(`  Tipo de divisão: ${divisionType}`)
console.log(`  Valor por palpite: R$ ${valorPorPalpite.toFixed(2)}`)

// 2. Calcular unidades e valor unitário
const calculation = calcularGrupo(modalidade as any, qtdGrupos, pos_from, pos_to, valorPorPalpite)

console.log(`\n2️⃣ Cálculo de unidades:`)
console.log(`  Combinações: ${calculation.combinations}`)
console.log(`  Posições: ${calculation.positions}`)
console.log(`  Unidades por palpite: ${calculation.combinations} × ${calculation.positions} = ${calculation.units}`)
console.log(`  Valor unitário: R$ ${valorPorPalpite.toFixed(2)} ÷ ${calculation.units} = R$ ${calculation.unitValue.toFixed(2)}`)

// 3. Buscar odd
const odd = buscarOdd(modalidade as any, pos_from, pos_to)
console.log(`\n3️⃣ Cotação (odd):`)
console.log(`  ${modalidade} na posição ${pos_from}º-${pos_to}º: ${odd}x`)

// 4. Calcular prêmio por unidade
const premioUnidade = odd * calculation.unitValue
console.log(`\n4️⃣ Prêmio por unidade:`)
console.log(`  ${odd} × R$ ${calculation.unitValue.toFixed(2)} = R$ ${premioUnidade.toFixed(2)}`)

// 5. Calcular retorno por palpite (assumindo 1 acerto)
const hitsPorPalpite = 1
const retornoPorPalpite = hitsPorPalpite * premioUnidade
console.log(`\n5️⃣ Retorno por palpite (assumindo 1 acerto):`)
console.log(`  ${hitsPorPalpite} acerto × R$ ${premioUnidade.toFixed(2)} = R$ ${retornoPorPalpite.toFixed(2)}`)

// 6. Calcular retorno total
const retornoTotal = retornoPorPalpite * qtdPalpites
console.log(`\n6️⃣ Retorno total:`)
console.log(`  ${qtdPalpites} palpites × R$ ${retornoPorPalpite.toFixed(2)} = R$ ${retornoTotal.toFixed(2)}`)

// 7. Comparar com esperado
console.log(`\n✅ Resultado:`)
console.log(`  Retorno calculado: R$ ${retornoTotal.toFixed(2)}`)
console.log(`  Retorno esperado: R$ 144,00`)
if (Math.abs(retornoTotal - 144.00) < 0.01) {
  console.log(`  ✅ CÁLCULO CORRETO!`)
} else {
  console.log(`  ❌ CÁLCULO INCORRETO! Diferença: R$ ${Math.abs(retornoTotal - 144.00).toFixed(2)}`)
  console.log(`\n🔍 Análise da diferença:`)
  console.log(`  O cálculo está ${retornoTotal > 144 ? 'maior' : 'menor'} que o esperado.`)
  console.log(`  Verifique:`)
  console.log(`    - Se o valor por palpite está correto (deve ser R$ 10,00)`)
  console.log(`    - Se a quantidade de palpites está correta (deve ser 4)`)
  console.log(`    - Se o tipo de divisão está correto (deve ser 'all')`)
}
