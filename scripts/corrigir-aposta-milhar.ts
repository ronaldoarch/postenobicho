/**
 * Script para corrigir apostas que foram salvas incorretamente como "Dupla de Grupo"
 * quando deveriam ser "Milhar"
 * 
 * Uso: npx tsx scripts/corrigir-aposta-milhar.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function corrigirApostasMilhar() {
  try {
    console.log('🔍 Buscando apostas com "Dupla de Grupo: 7777"...')
    
    // Buscar apostas que contêm "Dupla de Grupo: 7777" ou similar
    const apostas = await prisma.aposta.findMany({
      where: {
        OR: [
          { aposta: { contains: 'Dupla de Grupo: 7777' } },
          { aposta: { contains: 'Dupla de Grupo' } },
          { modalidade: { contains: 'Dupla de Grupo' } },
        ],
      },
    })

    console.log(`📊 Encontradas ${apostas.length} apostas para corrigir`)

    for (const aposta of apostas) {
      console.log(`\n📋 Analisando aposta ${aposta.id}:`)
      console.log(`   - Modalidade: ${aposta.modalidade}`)
      console.log(`   - Aposta: ${aposta.aposta}`)
      console.log(`   - Valor: R$ ${aposta.valor.toFixed(2)}`)
      console.log(`   - Retorno: R$ ${aposta.retornoPrevisto.toFixed(2)}`)

      // Verificar se realmente é uma aposta de milhar (número de 4 dígitos)
      const numeroMatch = aposta.aposta?.match(/:\s*(\d{4})/)
      const numero = numeroMatch ? numeroMatch[1] : null

      if (!numero) {
        console.log(`⚠️  Aposta ${aposta.id}: Não encontrou número de 4 dígitos`)
        
        // Tentar buscar nos detalhes
        let detalhesObj: any = {}
        if (aposta.detalhes) {
          try {
            detalhesObj = typeof aposta.detalhes === 'string' 
              ? JSON.parse(aposta.detalhes) 
              : aposta.detalhes
            
            // Verificar se tem numberBets nos detalhes
            const numberBets = detalhesObj.betData?.numberBets || detalhesObj.numberBets
            if (numberBets && numberBets.length > 0) {
              const primeiroNumero = numberBets[0]
              const numeroLimpo = primeiroNumero.replace(/\D/g, '')
              
              if (numeroLimpo.length === 4) {
                console.log(`✅ Encontrou número de 4 dígitos nos detalhes: ${numeroLimpo}`)
                
                // Calcular novo retorno previsto (Milhar: 5000x)
                const oddMilhar = 5000
                const novoRetornoPrevisto = aposta.valor * oddMilhar

                // Atualizar aposta
                await prisma.aposta.update({
                  where: { id: aposta.id },
                  data: {
                    modalidade: 'Milhar',
                    aposta: `Milhar: ${numeroLimpo}`,
                    retornoPrevisto: novoRetornoPrevisto,
                    detalhes: JSON.stringify({
                      ...detalhesObj,
                      modalityName: 'Milhar',
                      betData: {
                        ...(detalhesObj.betData || {}),
                        modalityName: 'Milhar',
                        modality: '9', // ID da modalidade Milhar
                      },
                    }),
                  },
                })

                console.log(`✅ Aposta ${aposta.id} corrigida:`)
                console.log(`   - Modalidade: Dupla de Grupo → Milhar`)
                console.log(`   - Aposta: ${aposta.aposta} → Milhar: ${numeroLimpo}`)
                console.log(`   - Retorno: R$ ${aposta.retornoPrevisto.toFixed(2)} → R$ ${novoRetornoPrevisto.toFixed(2)}`)
                continue
              }
            }
          } catch (e) {
            console.log(`⚠️  Erro ao parsear detalhes: ${e}`)
          }
        }
        
        console.log(`⚠️  Aposta ${aposta.id}: Não é uma aposta de milhar, pulando...`)
        continue
      }

      // Se encontrou número de 4 dígitos, corrigir
      console.log(`✅ Encontrou número de 4 dígitos: ${numero}`)
      console.log(`✅ Corrigindo de "Dupla de Grupo" para "Milhar"`)
      
      // Verificar se a milhar está cotada
      const cotacaoEspecial = await prisma.cotacaoEspecial.findFirst({
        where: {
          tipo: 'milhar',
          numero: numero,
          ativo: true,
        },
      })
      
      // Calcular novo retorno previsto
      let oddMilhar = 5000 // Odd normal da milhar
      if (cotacaoEspecial && cotacaoEspecial.cotacao !== null && cotacaoEspecial.cotacao > 0) {
        oddMilhar = cotacaoEspecial.cotacao
        console.log(`   ℹ️  Milhar cotada encontrada: odd especial = ${oddMilhar}x`)
      } else {
        console.log(`   ℹ️  Usando odd normal da milhar: ${oddMilhar}x`)
      }
      
      const novoRetornoPrevisto = aposta.valor * oddMilhar

      // Verificar detalhes
      let detalhesObj: any = {}
      if (aposta.detalhes) {
        try {
          detalhesObj = typeof aposta.detalhes === 'string' 
            ? JSON.parse(aposta.detalhes) 
            : aposta.detalhes
        } catch (e) {
          console.log(`⚠️  Erro ao parsear detalhes: ${e}`)
        }
      }

      // Atualizar aposta
      await prisma.aposta.update({
        where: { id: aposta.id },
        data: {
          modalidade: 'Milhar',
          aposta: `Milhar: ${numero}`,
          retornoPrevisto: novoRetornoPrevisto,
          detalhes: JSON.stringify({
            ...detalhesObj,
            modalityName: 'Milhar',
            betData: {
              ...(detalhesObj.betData || {}),
              modalityName: 'Milhar',
              modality: '9', // ID da modalidade Milhar
            },
          }),
        },
      })

      console.log(`✅ Aposta ${aposta.id} corrigida:`)
      console.log(`   - Modalidade: Dupla de Grupo → Milhar`)
      console.log(`   - Aposta: ${aposta.aposta} → Milhar: ${numero}`)
      console.log(`   - Retorno: R$ ${aposta.retornoPrevisto.toFixed(2)} → R$ ${novoRetornoPrevisto.toFixed(2)}`)
    }

    console.log('\n✅ Correção concluída!')
  } catch (error) {
    console.error('❌ Erro ao corrigir apostas:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

corrigirApostasMilhar()
