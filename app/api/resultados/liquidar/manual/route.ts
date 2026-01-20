import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  conferirPalpite,
  calcularValorPorPalpite,
  type ModalityType,
  type InstantResult,
  calcularPremioUnidade,
  buscarOdd,
  grupoParaDezenas,
} from '@/lib/bet-rules-engine'
import { verificarMilharCotada, verificarCentenaCotada, extrairCentena } from '@/lib/cotacao'

export const dynamic = 'force-dynamic'

/**
 * POST /api/resultados/liquidar/manual
 * 
 * Liquidação manual com resultados preenchidos pelo admin
 * 
 * Body:
 * - loteria: nome da loteria/extração
 * - dataConcurso: data do concurso (YYYY-MM-DD)
 * - horario: horário do sorteio
 * - premios: array de milhares (strings de 4 dígitos)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { loteria, dataConcurso, horario, premios } = body

    if (!loteria || !dataConcurso || !horario || !premios || premios.length === 0) {
      return NextResponse.json(
        { error: 'Dados incompletos. Preencha loteria, data, horário e pelo menos um prêmio.' },
        { status: 400 }
      )
    }

    // Converter prêmios para números
    const milhares = premios
      .map((p: string) => {
        const numStr = p.replace(/\D/g, '').padStart(4, '0').slice(-4)
        return parseInt(numStr, 10)
      })
      .filter((n: number) => !isNaN(n) && n >= 0 && n <= 9999)

    if (milhares.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum prêmio válido fornecido' },
        { status: 400 }
      )
    }

    // Calcular grupos dos prêmios
    const grupos = milhares.map((m: number) => {
      const dezena = m % 100
      if (dezena === 0) return 25
      return Math.floor((dezena - 1) / 4) + 1
    })

    const resultadoOficial: InstantResult = {
      prizes: milhares,
      groups: grupos,
    }

    // Buscar apostas pendentes que correspondem a este resultado
    const dataConcursoDate = new Date(dataConcurso)
    dataConcursoDate.setHours(0, 0, 0, 0)

    const apostasPendentes = await prisma.aposta.findMany({
      where: {
        status: 'pendente',
        loteria: {
          contains: loteria,
        },
        dataConcurso: {
          gte: new Date(dataConcursoDate.getTime()),
          lt: new Date(dataConcursoDate.getTime() + 24 * 60 * 60 * 1000),
        },
        horario: horario,
      },
      include: {
        usuario: true,
      },
    })

    if (apostasPendentes.length === 0) {
      return NextResponse.json({
        message: 'Nenhuma aposta pendente encontrada para os critérios informados',
        processadas: 0,
        liquidadas: 0,
        premioTotal: 0,
      })
    }

    // Mapeamento de modalidades
    const modalityMap: Record<string, ModalityType> = {
      Grupo: 'GRUPO',
      'Dupla de Grupo': 'DUPLA_GRUPO',
      'Terno de Grupo': 'TERNO_GRUPO',
      'Quadra de Grupo': 'QUADRA_GRUPO',
      'Quina de Grupo': 'QUINA_GRUPO',
      Dezena: 'DEZENA',
      Centena: 'CENTENA',
      Milhar: 'MILHAR',
      'Dezena Invertida': 'DEZENA_INVERTIDA',
      'Centena Invertida': 'CENTENA_INVERTIDA',
      'Milhar Invertida': 'MILHAR_INVERTIDA',
      'Milhar/Centena': 'MILHAR_CENTENA',
      'Passe vai': 'PASSE',
      'Passe vai e vem': 'PASSE_VAI_E_VEM',
      'Quadra de Dezena': 'QUADRA_DEZENA',
      'Duque de Dezena': 'DUQUE_DEZENA',
      'Duque de Dezena (EMD)': 'DUQUE_DEZENA_EMD',
      'Terno de Dezena': 'TERNO_DEZENA',
      'Terno de Dezena (EMD)': 'TERNO_DEZENA_EMD',
      'Dezeninha': 'DEZENINHA',
      'Terno de Grupo Seco': 'TERNO_GRUPO_SECO',
    }

    let processadas = 0
    let liquidadas = 0
    let premioTotalGeral = 0

    // Processar cada aposta
    for (const aposta of apostasPendentes) {
      try {
        processadas++

        // Parse dos detalhes (se for string JSON)
        let detalhes: any = null
        if (aposta.detalhes) {
          if (typeof aposta.detalhes === 'string') {
            try {
              detalhes = JSON.parse(aposta.detalhes)
            } catch (e) {
              console.error(`Erro ao fazer parse de detalhes da aposta ${aposta.id}:`, e)
              continue
            }
          } else {
            detalhes = aposta.detalhes
          }
        }
        
        if (!detalhes || !detalhes.betData) {
          console.warn(`Aposta ${aposta.id} não tem betData, pulando.`)
          continue
        }

        const betData = detalhes.betData as {
          modality: string | null
          modalityName?: string | null
          animalBets?: number[][]
          numberBets?: string[]
          numeroApostado?: string
          position: string | null
          customPosition?: boolean
          customPositionValue?: string
          amount: number
          divisionType: 'all' | 'each'
        }

        const modalityType = modalityMap[betData.modalityName || aposta.modalidade || ''] || 'GRUPO'

        // Parsear posição
        const positionToUse = betData.customPosition && betData.customPositionValue 
          ? betData.customPositionValue.trim() 
          : betData.position
        
        let pos_from = 1
        let pos_to = 1
        if (positionToUse) {
          if (positionToUse === '1st') {
            pos_from = 1
            pos_to = 1
          } else if (positionToUse.includes('-')) {
            const [from, to] = positionToUse.split('-').map(Number)
            pos_from = from || 1
            pos_to = to || 1
          } else {
            const singlePos = parseInt(positionToUse.replace(/º/g, '').replace(/\s/g, ''), 10)
            if (!isNaN(singlePos) && singlePos >= 1 && singlePos <= 7) {
              pos_from = singlePos
              pos_to = singlePos
            }
          }
        }

        // Determinar quantos palpites existem
        const qtdPalpites = betData.animalBets?.length || betData.numberBets?.length || (betData.numeroApostado ? 1 : 0)
        if (qtdPalpites === 0) {
          console.warn(`Aposta ${aposta.id} não tem palpites válidos, pulando.`)
          continue
        }
        
        const valorPorPalpite = calcularValorPorPalpite(
          betData.amount,
          qtdPalpites,
          betData.divisionType
        )

        // Preparar palpite para conferência baseado no tipo de modalidade
        let palpiteParaConferir: { grupos?: number[], numero?: string } | null = null
        
        if (modalityType.includes('GRUPO') || modalityType === 'PASSE' || modalityType === 'PASSE_VAI_E_VEM') {
          // Modalidades de grupo: usar animalBets
          const gruposApostados = betData.animalBets?.[0] || []
          if (gruposApostados.length === 0) {
            console.warn(`Aposta ${aposta.id} é de grupo mas não tem grupos apostados, pulando.`)
            continue
          }
          palpiteParaConferir = { grupos: gruposApostados }
        } else {
          // Modalidades de número: usar numeroApostado ou numberBets
          const numeroParaConferir = betData.numeroApostado || betData.numberBets?.[0] || ''
          if (!numeroParaConferir) {
            console.warn(`Aposta ${aposta.id} é de número mas não tem número apostado, pulando.`)
            continue
          }
          palpiteParaConferir = { numero: numeroParaConferir }
        }

        // Verificar se o palpite foi preparado corretamente
        if (!palpiteParaConferir) {
          console.warn(`Aposta ${aposta.id} não tem palpite válido, pulando.`)
          continue
        }

        // Conferir palpite usando a função correta
        let premioTotalAposta = 0
        
        try {
          const resultadoConferencia = conferirPalpite(
            resultadoOficial,
            modalityType,
            palpiteParaConferir,
            pos_from,
            pos_to,
            valorPorPalpite,
            betData.divisionType
          )

          if (resultadoConferencia.prize.hits > 0) {
            // Calcular prêmio inicial com a odd padrão
            premioTotalAposta = resultadoConferencia.totalPrize

            // Verificar e aplicar cotações especiais para MILHAR e CENTENA
            // A cotação especial SUBSTITUI a odd normal, não multiplica o prêmio
            if (modalityType === 'MILHAR' || modalityType === 'CENTENA' || modalityType === 'MILHAR_CENTENA') {
              // Usar o número do palpite preparado para conferência
              const numeroApostadoStr = palpiteParaConferir?.numero || ''
              if (numeroApostadoStr) {
                const numeroParaVerificar = numeroApostadoStr.replace(/\D/g, '').padStart(4, '0').slice(-4)
              
                // Verificar se ganhou em alguma posição
                for (let pos = pos_from - 1; pos < pos_to && pos < resultadoOficial.prizes.length; pos++) {
                  const premioGanho = resultadoOficial.prizes[pos]
                  const premioStr = premioGanho.toString().padStart(4, '0')
                  
                  if (modalityType === 'MILHAR' && numeroParaVerificar === premioStr) {
                    const { cotada, cotacao } = await verificarMilharCotada(premioStr)
                    if (cotada) {
                      if (cotacao !== null && cotacao > 0) {
                        // A cotação especial substitui a odd normal
                        // Fórmula: (cotacao_especial / odd_normal) * premio_calculado
                        const oddNormal = buscarOdd(modalityType, pos_from, pos_to)
                        premioTotalAposta = (cotacao / oddNormal) * premioTotalAposta
                      } else {
                        // Redução padrão de 1/6 se cotada mas sem cotação específica
                        premioTotalAposta = premioTotalAposta / 6
                      }
                      break
                    }
                  } else if (modalityType === 'CENTENA') {
                    const centenaApostada = extrairCentena(numeroParaVerificar)
                    const centenaGanha = premioStr.slice(-3)
                    if (centenaApostada === centenaGanha) {
                      const { cotada, cotacao } = await verificarCentenaCotada(centenaGanha)
                      if (cotada) {
                        if (cotacao !== null && cotacao > 0) {
                          const oddNormal = buscarOdd(modalityType, pos_from, pos_to)
                          premioTotalAposta = (cotacao / oddNormal) * premioTotalAposta
                        } else {
                          premioTotalAposta = premioTotalAposta / 6
                        }
                        break
                      }
                    }
                  } else if (modalityType === 'MILHAR_CENTENA') {
                    const centenaApostada = extrairCentena(numeroParaVerificar)
                    const centenaGanha = premioStr.slice(-3)
                    
                    if (numeroParaVerificar === premioStr || centenaApostada === centenaGanha) {
                      const { cotada: milharCotada, cotacao: milharCotacao } = await verificarMilharCotada(premioStr)
                      const { cotada: centenaCotada, cotacao: centenaCotacao } = await verificarCentenaCotada(centenaGanha)
                      
                      if (milharCotada || centenaCotada) {
                        const cotacaoUsar = milharCotacao ?? centenaCotacao
                        if (cotacaoUsar !== null && cotacaoUsar > 0) {
                          const oddNormal = buscarOdd(modalityType, pos_from, pos_to)
                          premioTotalAposta = (cotacaoUsar / oddNormal) * premioTotalAposta
                        } else {
                          premioTotalAposta = premioTotalAposta / 6
                        }
                        break
                      }
                    }
                  }
                }
              }
            }
          }
        } catch (error) {
          console.error(`Erro ao conferir palpite da aposta ${aposta.id}:`, error)
          // Continuar para próxima aposta mesmo se houver erro
        }

        // Atualizar status da aposta
        if (premioTotalAposta > 0) {
          await prisma.aposta.update({
            where: { id: aposta.id },
            data: {
              status: 'liquidado',
              retornoPrevisto: premioTotalAposta,
              detalhes: JSON.stringify({
                ...detalhes,
                resultadoOficial: resultadoOficial.prizes,
                premioCalculado: premioTotalAposta,
              }),
            },
          })

          // Atualizar saldo do usuário
          await prisma.usuario.update({
            where: { id: aposta.usuarioId },
            data: {
              saldo: {
                increment: premioTotalAposta,
              },
            },
          })

          liquidadas++
          premioTotalGeral += premioTotalAposta
        } else {
          await prisma.aposta.update({
            where: { id: aposta.id },
            data: {
              status: 'perdida',
              detalhes: JSON.stringify({
                ...detalhes,
                resultadoOficial: resultadoOficial.prizes,
                premioCalculado: 0,
              }),
            },
          })
        }
      } catch (error) {
        console.error(`Erro ao processar aposta ${aposta.id}:`, error)
      }
    }

    return NextResponse.json({
      message: 'Liquidação manual concluída',
      processadas,
      liquidadas,
      premioTotal: premioTotalGeral,
      fonte: 'manual',
    })
  } catch (error: any) {
    console.error('Erro na liquidação manual:', error)
    console.error('Stack trace:', error.stack)
    return NextResponse.json(
      { 
        error: 'Erro ao processar liquidação manual', 
        details: error.message || String(error),
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}
