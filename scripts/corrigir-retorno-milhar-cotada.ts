/**
 * Script para corrigir retorno previsto de apostas de milhar cotada
 * 
 * Uso: npx tsx scripts/corrigir-retorno-milhar-cotada.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function corrigirRetornoMilharCotada() {
  try {
    console.log('🔍 Buscando apostas de Milhar...')
    
    // Buscar todas as apostas de Milhar
    const apostas = await prisma.aposta.findMany({
      where: {
        modalidade: 'Milhar',
      },
    })

    console.log(`📊 Encontradas ${apostas.length} apostas de Milhar`)

    let corrigidas = 0

    for (const aposta of apostas) {
      // Extrair número apostado
      const numeroMatch = aposta.aposta?.match(/:\s*(\d{4})/)
      const numero = numeroMatch ? numeroMatch[1] : null

      if (!numero) {
        // Tentar buscar nos detalhes
        let detalhesObj: any = {}
        if (aposta.detalhes) {
          try {
            detalhesObj = typeof aposta.detalhes === 'string' 
              ? JSON.parse(aposta.detalhes) 
              : aposta.detalhes
            
            const numberBets = detalhesObj.betData?.numberBets || detalhesObj.numberBets
            if (numberBets && numberBets.length > 0) {
              const primeiroNumero = numberBets[0]
              const numeroLimpo = primeiroNumero.replace(/\D/g, '').padStart(4, '0').slice(-4)
              
              if (numeroLimpo.length === 4) {
                await corrigirAposta(aposta, numeroLimpo)
                corrigidas++
                continue
              }
            }
          } catch (e) {
            console.log(`⚠️  Aposta ${aposta.id}: Erro ao parsear detalhes`)
          }
        }
        continue
      }

      await corrigirAposta(aposta, numero)
      corrigidas++
    }

    console.log(`\n✅ Correção concluída! ${corrigidas} apostas corrigidas.`)
  } catch (error) {
    console.error('❌ Erro ao corrigir apostas:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }

  async function corrigirAposta(aposta: any, numero: string) {
    // Verificar se a milhar está cotada
    const cotacaoEspecial = await prisma.cotacaoEspecial.findFirst({
      where: {
        tipo: 'milhar',
        numero: numero,
        ativo: true,
      },
    })

    let oddMilhar = 5000 // Odd normal da milhar
    let estaCotada = false

    if (cotacaoEspecial && cotacaoEspecial.cotacao !== null && cotacaoEspecial.cotacao > 0) {
      oddMilhar = cotacaoEspecial.cotacao
      estaCotada = true
    }

    // Calcular novo retorno previsto
    const novoRetornoPrevisto = aposta.valor * oddMilhar

    // Verificar se precisa corrigir
    if (Math.abs(aposta.retornoPrevisto - novoRetornoPrevisto) > 0.01) {
      console.log(`\n📋 Aposta ${aposta.id}:`)
      console.log(`   - Número: ${numero}`)
      console.log(`   - Valor: R$ ${aposta.valor.toFixed(2)}`)
      console.log(`   - ${estaCotada ? `Cotada (${oddMilhar}x)` : `Normal (${oddMilhar}x)`}`)
      console.log(`   - Retorno atual: R$ ${aposta.retornoPrevisto.toFixed(2)}`)
      console.log(`   - Retorno correto: R$ ${novoRetornoPrevisto.toFixed(2)}`)

      // Atualizar aposta
      await prisma.aposta.update({
        where: { id: aposta.id },
        data: {
          retornoPrevisto: novoRetornoPrevisto,
        },
      })

      console.log(`   ✅ Corrigida!`)
    } else {
      console.log(`✓ Aposta ${aposta.id}: Retorno já está correto (R$ ${aposta.retornoPrevisto.toFixed(2)})`)
    }
  }
}

corrigirRetornoMilharCotada()
