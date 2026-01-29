/**
 * Teste para entender o cálculo correto considerando posições
 * 
 * Exemplo:
 * - Modalidade: Grupo
 * - Posição: 1º ao 5º (5 posições)
 * - Palpites: 4 grupos
 * - Valor por palpite: R$ 10,00
 * 
 * Cada palpite pode ganhar em múltiplas posições:
 * - Mínimo: 1 posição ganha = 1 unidade ganha
 * - Máximo: 5 posições ganham = 5 unidades ganham
 */

import { calcularGrupo, buscarOdd } from '@/lib/bet-rules-engine'

const modalidade = 'GRUPO'
const pos_from = 1
const pos_to = 5
const qtdGrupos = 1
const valorPorPalpite = 10.00
const qtdPalpites = 4

console.log('=== 🧪 Teste de Cálculo com Posições ===\n')
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

// CENÁRIO 1: Cada palpite ganha em 1 posição (mínimo)
console.log('📉 CENÁRIO MÍNIMO: Cada palpite ganha em 1 posição')
const hitsMinimo = 1
const retornoPorPalpiteMinimo = hitsMinimo * premioUnidade
const retornoTotalMinimo = retornoPorPalpiteMinimo * qtdPalpites
console.log(`  Acertos por palpite: ${hitsMinimo}`)
console.log(`  Retorno por palpite: ${hitsMinimo} × R$ ${premioUnidade.toFixed(2)} = R$ ${retornoPorPalpiteMinimo.toFixed(2)}`)
console.log(`  Retorno total: ${qtdPalpites} palpites × R$ ${retornoPorPalpiteMinimo.toFixed(2)} = R$ ${retornoTotalMinimo.toFixed(2)}\n`)

// CENÁRIO 2: Cada palpite ganha em todas as posições (máximo)
console.log('📈 CENÁRIO MÁXIMO: Cada palpite ganha em todas as posições')
const hitsMaximo = calculation.positions
const retornoPorPalpiteMaximo = hitsMaximo * premioUnidade
const retornoTotalMaximo = retornoPorPalpiteMaximo * qtdPalpites
console.log(`  Acertos por palpite: ${hitsMaximo} (todas as posições)`)
console.log(`  Retorno por palpite: ${hitsMaximo} × R$ ${premioUnidade.toFixed(2)} = R$ ${retornoPorPalpiteMaximo.toFixed(2)}`)
console.log(`  Retorno total: ${qtdPalpites} palpites × R$ ${retornoPorPalpiteMaximo.toFixed(2)} = R$ ${retornoTotalMaximo.toFixed(2)}\n`)

// CENÁRIO 3: Cálculo atual (multiplicando por qtdPalpites)
console.log('⚠️  CÁLCULO ATUAL (multiplicando por qtdPalpites):')
const retornoAtual = premioUnidade * qtdPalpites
console.log(`  Retorno: R$ ${premioUnidade.toFixed(2)} × ${qtdPalpites} = R$ ${retornoAtual.toFixed(2)}`)
console.log(`  ❌ Isso está errado! Não considera as posições.\n`)

// CENÁRIO 4: Cálculo correto (multiplicando por posições E palpites)
console.log('✅ CÁLCULO CORRETO (multiplicando por posições E palpites):')
const retornoCorretoMinimo = premioUnidade * 1 * qtdPalpites // mínimo: 1 posição
const retornoCorretoMaximo = premioUnidade * calculation.positions * qtdPalpites // máximo: todas posições
console.log(`  Mínimo: R$ ${premioUnidade.toFixed(2)} × 1 × ${qtdPalpites} = R$ ${retornoCorretoMinimo.toFixed(2)}`)
console.log(`  Máximo: R$ ${premioUnidade.toFixed(2)} × ${calculation.positions} × ${qtdPalpites} = R$ ${retornoCorretoMaximo.toFixed(2)}\n`)

console.log('📊 RESUMO:')
console.log(`  Prêmio mínimo possível: R$ ${retornoTotalMinimo.toFixed(2)}`)
console.log(`  Prêmio máximo possível: R$ ${retornoTotalMaximo.toFixed(2)}`)
