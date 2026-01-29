import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { parseSessionToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  gerarResultadoInstantaneo,
  conferirPalpite,
  calcularValorPorPalpite,
  type ModalityType,
} from '@/lib/bet-rules-engine'
import { ANIMALS } from '@/data/animals'
import { verificarLimiteDescarga, verificarLimiteDescargaPorNumero } from '@/lib/descarga'
import { MetaTrackingServer } from '@/lib/meta-tracking-server'
import { WebhookTracker } from '@/lib/webhook-tracker'
import { getHorarioRealApuracao, temSorteioNoDia } from '@/data/horarios-reais-apuracao'
import { extracoes } from '@/data/extracoes'
import { getClientIP, geolocateIP, salvarLocalizacaoUsuario } from '@/lib/ip-geolocation'

export async function GET() {
  const session = cookies().get('lotbicho_session')?.value
  const user = parseSessionToken(session)

  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  try {
    const apostas = await prisma.aposta.findMany({
      where: { usuarioId: user.id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      user: { id: user.id, email: user.email, nome: user.nome },
      apostas,
      total: apostas.length,
    })
  } catch (error) {
    console.error('Erro ao buscar apostas', error)
    return NextResponse.json({ error: 'Erro ao carregar apostas' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = cookies().get('lotbicho_session')?.value
  const user = parseSessionToken(session)

  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const {
      concurso,
      loteria,
      estado,
      horario,
      dataConcurso,
      modalidade,
      aposta,
      valor,
      retornoPrevisto,
      status,
      detalhes,
      useBonus,
    } = body || {}

    if (!valor || Number.isNaN(Number(valor))) {
      return NextResponse.json({ error: 'Valor inválido' }, { status: 400 })
    }

    // VALIDAÇÃO: Verificar se há sorteio no dia da semana para a loteria/horário selecionado
    if (loteria && dataConcurso && horario) {
      try {
        const dataConcursoDate = new Date(dataConcurso)
        const extracaoId = parseInt(loteria, 10)
        const extracao = !isNaN(extracaoId)
          ? extracoes.find((e) => e.id === extracaoId)
          : extracoes.find((e) => e.name.toLowerCase() === loteria.toLowerCase() && e.time === horario)
        
        if (extracao) {
          // Verificar se a extração está ativa
          if (!extracao.active) {
            return NextResponse.json(
              {
                error: 'Aposta não permitida',
                mensagem: `A extração ${extracao.name} ${horario} está desativada.`,
                bloqueado: true,
              },
              { status: 400 }
            )
          }
          
          const horarioReal = getHorarioRealApuracao(extracao.name, horario)
          
          if (horarioReal) {
            const diaSemana = dataConcursoDate.getDay()
            const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
            
            // Verificar PRIMEIRO se há configuração explícita no banco de dados
            const configExtracao = await prisma.configuracaoExtracoesPorDia.findUnique({
              where: {
                diaSemana_extracaoId: {
                  diaSemana,
                  extracaoId: extracao.id,
                },
              },
            })

            // Se existe configuração no banco, ELA MANDA
            if (configExtracao) {
              // Se estiver explicitamente desativada, bloqueia
              if (!configExtracao.ativo) {
                return NextResponse.json(
                  {
                    error: 'Aposta bloqueada',
                    mensagem: `${extracao.name} ${horario} não está permitida para receber apostas em ${diasSemana[diaSemana]} (configuração admin).`,
                    bloqueado: true,
                  },
                  { status: 400 }
                )
              }
              // Se estiver ativa (configExtracao.ativo === true), PERMITE (ignora temSorteioNoDia)
            } else {
              // Se NÃO existe configuração específica para esta extração, verificar comportamento padrão
              
              // 1. Verificar se há OUTRAS extrações configuradas para este dia
              // Se houver, significa que o admin configurou este dia e esta extração ficou de fora -> BLOQUEIA
              const outrasConfiguradas = await prisma.configuracaoExtracoesPorDia.findFirst({
                where: {
                  diaSemana,
                  ativo: true,
                },
              })

              if (outrasConfiguradas) {
                return NextResponse.json(
                  {
                    error: 'Aposta bloqueada',
                    mensagem: `${extracao.name} ${horario} não está permitida para receber apostas em ${diasSemana[diaSemana]}. Verifique as configurações de extrações por dia.`,
                    bloqueado: true,
                  },
                  { status: 400 }
                )
              }

              // 2. Se não houver NENHUMA configuração para o dia, cair no comportamento padrão (arquivo estático)
              if (!temSorteioNoDia(horarioReal, diaSemana)) {
                return NextResponse.json(
                  {
                    error: 'Aposta não permitida',
                    mensagem: `${diasSemana[diaSemana]} não tem sorteio para ${extracao.name} ${horario}. Esta extração só tem sorteio em: ${extracao.days || 'Todos os dias'}`,
                    bloqueado: true,
                  },
                  { status: 400 }
                )
              }
            }
          }
        }
      } catch (error) {
        console.error('Erro ao validar dia da semana:', error)
        // Continua com a aposta se houver erro na validação (não bloqueia)
      }
    }

    // Validar múltiplas extrações se houver selectedExtracoes
    if (detalhes && typeof detalhes === 'object' && 'betData' in detalhes) {
      const betData = (detalhes as any).betData
      if (betData.selectedExtracoes && Array.isArray(betData.selectedExtracoes) && betData.selectedExtracoes.length > 0) {
        const dataConcursoDate = dataConcurso ? new Date(dataConcurso) : new Date()
        const diaSemana = dataConcursoDate.getDay()
        const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

        for (const extracaoIdStr of betData.selectedExtracoes) {
          const extracaoId = parseInt(extracaoIdStr, 10)
          if (isNaN(extracaoId)) continue

          const extracao = extracoes.find((e) => e.id === extracaoId)
          if (!extracao || !extracao.active) continue

          // Verificar configuração de extrações por dia
          const configExtracao = await prisma.configuracaoExtracoesPorDia.findUnique({
            where: {
              diaSemana_extracaoId: {
                diaSemana,
                extracaoId,
              },
            },
          })

          // Se existe configuração e está inativa, bloquear
          if (configExtracao && !configExtracao.ativo) {
            return NextResponse.json(
              {
                error: 'Aposta bloqueada',
                mensagem: `${extracao.name} ${extracao.time} não está permitida para receber apostas em ${diasSemana[diaSemana]}.`,
                bloqueado: true,
              },
              { status: 400 }
            )
          }

          // Se não existe configuração, verificar se há outras extrações configuradas para este dia
          if (!configExtracao) {
            const outrasConfiguradas = await prisma.configuracaoExtracoesPorDia.findFirst({
              where: {
                diaSemana,
                ativo: true,
              },
            })

            // Se há outras extrações configuradas para este dia, mas esta não está, bloquear
            if (outrasConfiguradas) {
              return NextResponse.json(
                {
                  error: 'Aposta bloqueada',
                  mensagem: `${extracao.name} ${extracao.time} não está permitida para receber apostas em ${diasSemana[diaSemana]}. Verifique as configurações de extrações por dia.`,
                  bloqueado: true,
                },
                { status: 400 }
              )
            }
          }
        }
      }
    }

    const valorNum = Number(valor)
    const useBonusFlag = Boolean(useBonus)
    const isInstant = detalhes && typeof detalhes === 'object' && 'betData' in detalhes && (detalhes as any).betData?.instant === true

    // VERIFICAR LIMITES DE DESCARGA ANTES DE PROCESSAR A APOSTA
    if (isInstant && detalhes && typeof detalhes === 'object' && 'betData' in detalhes) {
      const betData = (detalhes as any).betData as {
        modalityName?: string | null
        numberBets?: string[]
        position: string | null
        customPosition?: boolean
        customPositionValue?: string
        isNumberModality?: boolean
      }

      // Mapear nome da modalidade para tipo
      const modalityMap: Record<string, ModalityType> = {
        'Grupo': 'GRUPO',
        'Dupla de Grupo': 'DUPLA_GRUPO',
        'Terno de Grupo': 'TERNO_GRUPO',
        'Quadra de Grupo': 'QUADRA_GRUPO',
        'Dezena': 'DEZENA',
        'Centena': 'CENTENA',
        'Milhar': 'MILHAR',
        'Dezena Invertida': 'DEZENA_INVERTIDA',
        'Centena Invertida': 'CENTENA_INVERTIDA',
        'Milhar Invertida': 'MILHAR_INVERTIDA',
        'Milhar/Centena': 'MILHAR_CENTENA',
        'Passe vai': 'PASSE',
        'Passe vai e vem': 'PASSE_VAI_E_VEM',
        'Quadra de Dezena': 'QUADRA_DEZENA',
        'Duque de Dezena (EMD)': 'DUQUE_DEZENA_EMD',
        'Terno de Dezena (EMD)': 'TERNO_DEZENA_EMD',
        'Dezeninha': 'DEZENINHA',
        'Terno de Grupo Seco': 'TERNO_GRUPO_SECO',
      }

      const modalityType = modalityMap[betData.modalityName || modalidade || ''] || 'GRUPO'
      const modalidadeNome = betData.modalityName || modalidade || ''
      const loteriaAposta = loteria || null
      const horarioAposta = horario || null

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

      // Verificar limites por número + extração + prêmio
      for (let premio = pos_from; premio <= pos_to && premio <= 5; premio++) {
        // Se é modalidade numérica, verificar limite por número específico
        if (betData.isNumberModality && betData.numberBets && betData.numberBets.length > 0) {
          for (const numberBet of betData.numberBets) {
            // Normalizar número (remover formatação)
            const numeroLimpo = numberBet.replace(/\D/g, '')
            
            // Determinar tipo de número baseado no tamanho e modalidade
            let numeroParaVerificar: string | null = null
            
            if (modalityType === 'MILHAR' || modalityType === 'MILHAR_INVERTIDA' || modalityType === 'MILHAR_CENTENA') {
              // Milhar: 4 dígitos
              numeroParaVerificar = numeroLimpo.padStart(4, '0').slice(-4)
            } else if (modalityType === 'CENTENA' || modalityType === 'CENTENA_INVERTIDA') {
              // Centena: 3 dígitos
              numeroParaVerificar = numeroLimpo.padStart(4, '0').slice(-3)
            } else if (modalityType === 'DEZENA' || modalityType === 'DEZENA_INVERTIDA') {
              // Dezena: 2 dígitos
              numeroParaVerificar = numeroLimpo.padStart(4, '0').slice(-2)
            }
            
            if (numeroParaVerificar) {
              const verificacao = await verificarLimiteDescargaPorNumero(
                modalidadeNome,
                premio,
                numeroParaVerificar,
                loteriaAposta,
                horarioAposta,
                valorNum
              )
              
              // BLOQUEAR a aposta se o limite foi atingido
              if (verificacao.bloqueado) {
                return NextResponse.json(
                  {
                    error: 'Aposta bloqueada',
                    mensagem: verificacao.mensagem || `O número ${numeroParaVerificar} no ${premio}º prêmio atingiu o limite de descarga.`,
                    bloqueado: true,
                    limite: verificacao.limite,
                    valorAtual: verificacao.valorAtual,
                  },
                  { status: 403 }
                )
              }
            }
          }
        }
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      const usuario = await tx.usuario.findUnique({ 
        where: { id: user.id },
        select: {
          id: true,
          saldo: true,
          bonus: true,
          bonusBloqueado: true,
          rolloverNecessario: true,
          rolloverAtual: true,
          jaApostouComSaldoReal: true,
          jaApostou: true,
        }
      })
      if (!usuario) throw new Error('Usuário não encontrado')

      // NOVO CÁLCULO: Dividir valor pelas posições, depois multiplicar pelas extrações
      // Exemplo: R$ 2,00 / 5 posições = R$ 0,40 por aposta
      // Se 3 extrações: 3 × R$ 0,40 = R$ 6,00 total
      // CÁLCULO CORRETO: O valor digitado é POR EXTRAÇÃO
      // Exemplo: R$ 2,00 por extração, 3 extrações = R$ 6,00 total debitado
      // Cada aposta salva: R$ 2,00 (valor por extração)
      // Para prêmio: R$ 2,00 / 3 palpites / 5 posições = valor por palpite por posição
      // Se ganhar: R$ 2,00 × cotação (20 para grupo) = R$ 40,00 por extração ganha
      let valorTotalParaDebitar = valorNum
      if (detalhes && typeof detalhes === 'object' && 'betData' in detalhes) {
        const betData = (detalhes as any).betData
        
        // Calcular quantidade de extrações (pode estar em selectedExtracoes ou location)
        const qtdExtracoes = betData.selectedExtracoes?.length || (betData.location ? 1 : 0) || 1
        
        // O valor digitado é POR EXTRAÇÃO e esta rota processa UMA aposta por vez.
        // Portanto, NÃO devemos multiplicar pela quantidade de extrações aqui, 
        // pois o frontend envia uma requisição separada para cada extração.
        // O betData.selectedExtracoes é apenas informativo do contexto geral.
        // valorTotalParaDebitar = valorNum * qtdExtracoes // REMOVIDO: Isso duplicava a cobrança
        
        // Se "para cada palpite" (each): multiplicar pelo número de palpites
        if (betData.divisionType === 'each') {
          const qtdPalpites = betData.isNumberModality 
            ? (betData.numberBets?.length || 0)
            : (betData.animalBets?.length || 0)
          valorTotalParaDebitar = valorTotalParaDebitar * qtdPalpites
        }
        
        console.log('DEBUG SALDO APOSTA:', {
          valorNum,
          qtdExtracoes,
          divisionType: betData.divisionType,
          valorTotalParaDebitar,
          saldoUsuario: usuario.saldo,
          bonusUsuario: usuario.bonus,
          useBonusFlag,
          bonusDisponivel: useBonusFlag && usuario.bonus > 0 ? usuario.bonus : 0,
          totalDisponivel: usuario.saldo + (useBonusFlag && usuario.bonus > 0 ? usuario.bonus : 0)
        })
      }

      const bonusDisponivel = useBonusFlag && usuario.bonus > 0 ? usuario.bonus : 0
      const saldoDisponivel = usuario.saldo
      const totalDisponivel = saldoDisponivel + bonusDisponivel

      if (valorTotalParaDebitar > totalDisponivel) {
        throw new Error('Saldo insuficiente')
      }

      // REGRA: Usuário precisa apostar pelo menos uma vez com saldo real antes de usar bônus
      if (useBonusFlag && bonusDisponivel > 0 && !usuario.jaApostouComSaldoReal) {
        throw new Error('Você precisa apostar pelo menos uma vez com saldo real antes de usar o bônus')
      }

      // Debita primeiro do saldo, depois do bônus (se permitido)
      let debitarBonus = 0
      let debitarSaldo = Math.min(saldoDisponivel, valorTotalParaDebitar)
      const restante = valorTotalParaDebitar - debitarSaldo
      if (restante > 0) {
        if (bonusDisponivel <= 0) throw new Error('Saldo insuficiente (bônus indisponível)')
        debitarBonus = restante
      }
      
      // Marcar que já apostou com saldo real se debitou saldo
      const jaApostouComSaldoReal = usuario.jaApostouComSaldoReal || debitarSaldo > 0
      const jaApostou = usuario.jaApostou || debitarSaldo > 0 || debitarBonus > 0

      let premioTotal = 0
      let resultadoInstantaneo = null

      // Processar aposta instantânea
      if (isInstant && detalhes && typeof detalhes === 'object' && 'betData' in detalhes) {
        const betData = (detalhes as any).betData as {
          modality: string | null
          modalityName?: string | null
          animalBets?: number[][]
          numberBets?: string[]
          position: string | null
          customPosition?: boolean
          customPositionValue?: string
          amount: number
          divisionType: 'all' | 'each'
          isNumberModality?: boolean
        }

        // Mapear nome da modalidade para tipo
        const modalityMap: Record<string, ModalityType> = {
          'Grupo': 'GRUPO',
          'Dupla de Grupo': 'DUPLA_GRUPO',
          'Terno de Grupo': 'TERNO_GRUPO',
          'Quadra de Grupo': 'QUADRA_GRUPO',
          'Dezena': 'DEZENA',
          'Centena': 'CENTENA',
          'Milhar': 'MILHAR',
          'Dezena Invertida': 'DEZENA_INVERTIDA',
          'Centena Invertida': 'CENTENA_INVERTIDA',
          'Milhar Invertida': 'MILHAR_INVERTIDA',
          'Milhar/Centena': 'MILHAR_CENTENA',
          'Passe vai': 'PASSE',
          'Passe vai e vem': 'PASSE_VAI_E_VEM',
          'Quadra de Dezena': 'QUADRA_DEZENA',
          'Duque de Dezena (EMD)': 'DUQUE_DEZENA_EMD',
          'Terno de Dezena (EMD)': 'TERNO_DEZENA_EMD',
          'Dezeninha': 'DEZENINHA',
          'Terno de Grupo Seco': 'TERNO_GRUPO_SECO',
        }

        const modalityType = modalityMap[betData.modalityName || ''] || 'GRUPO'

        // Parsear posição (ex: "1-5" -> pos_from=1, pos_to=5)
        // Usa posição personalizada se disponível, senão usa posição padrão
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
            // Posição única (ex: "7" -> pos_from=7, pos_to=7)
            const singlePos = parseInt(positionToUse.replace(/º/g, '').replace(/\s/g, ''), 10)
            if (!isNaN(singlePos) && singlePos >= 1 && singlePos <= 7) {
              pos_from = singlePos
              pos_to = singlePos
            }
          }
        }

        // Limite já foi verificado antes da transação

        // Gerar resultado instantâneo
        resultadoInstantaneo = gerarResultadoInstantaneo(Math.max(pos_to, 7))

        // Calcular valor por palpite
        const qtdPalpites = betData.isNumberModality 
          ? (betData.numberBets?.length || 0)
          : (betData.animalBets?.length || 0)
        const valorPorPalpite = calcularValorPorPalpite(
          betData.amount,
          qtdPalpites,
          betData.divisionType
        )

        // Processar palpites de animais
        if (betData.animalBets && betData.animalBets.length > 0) {
          for (const animalBet of betData.animalBets) {
            const grupos = animalBet.map((animalId) => {
              // Encontrar o grupo do animal
              const animal = ANIMALS.find((a) => a.id === animalId)
              if (!animal) {
                throw new Error(`Animal não encontrado: ${animalId}`)
              }
              return animal.group
            })

            const palpiteData: { grupos?: number[]; numero?: string } = { grupos }

            const conferirPalpiteFn = conferirPalpite as any
            const conferencia = await conferirPalpiteFn(
              resultadoInstantaneo,
              modalityType,
              palpiteData,
              pos_from,
              pos_to,
              valorPorPalpite,
              betData.divisionType,
              betData.modality ? parseInt(betData.modality) : undefined,
              betData.modalityName || undefined
            )

            premioTotal += conferencia.totalPrize
          }
        }

        // Processar palpites numéricos
        if (betData.numberBets && betData.numberBets.length > 0) {
          for (const numberBet of betData.numberBets) {
            let palpiteData: { grupos?: number[]; numero?: string; dezenas?: string } = {}

            // Processar diferentes formatos de números
            if (modalityType === 'DUQUE_DEZENA_EMD' || modalityType === 'TERNO_DEZENA_EMD') {
              // EMD: formato "12-23" ou "12-23-34"
              palpiteData = { dezenas: numberBet }
            } else if (modalityType === 'QUADRA_DEZENA') {
              // Quadra de Dezena: formato "12-23-34-45"
              palpiteData = { dezenas: numberBet }
            } else if (modalityType === 'DUQUE_DEZENA' || modalityType === 'TERNO_DEZENA') {
              // Duque/Terno de Dezena: formato "12-23" ou "12-23-34"
              palpiteData = { dezenas: numberBet }
            } else {
              // Modalidades numéricas normais (Dezena, Centena, Milhar)
              palpiteData = { numero: numberBet }
            }

            const conferirPalpiteFn = conferirPalpite as any
            const conferencia = await conferirPalpiteFn(
              resultadoInstantaneo,
              modalityType,
              palpiteData,
              pos_from,
              pos_to,
              valorPorPalpite,
              betData.divisionType,
              betData.modality ? parseInt(betData.modality) : undefined,
              betData.modalityName || undefined
            )

            premioTotal += conferencia.totalPrize
          }
        }

        // Atualizar saldo: debita aposta e credita prêmio
        // Cálculo dentro da transação garante atomicidade
        const saldoFinal = usuario.saldo - debitarSaldo + premioTotal
        const bonusFinal = usuario.bonus - debitarBonus
        
        // Calcular novo rollover após incrementar
        const novoRolloverAtual = (usuario.rolloverAtual || 0) + valorTotalParaDebitar
        const rolloverNecessario = usuario.rolloverNecessario || 0
        
        // Se completou o rollover, liberar bônus bloqueado
        let bonusBloqueadoFinal = usuario.bonusBloqueado || 0
        
        if (bonusBloqueadoFinal > 0 && novoRolloverAtual >= rolloverNecessario && rolloverNecessario > 0) {
          // Liberar todo o bônus bloqueado quando completar o rollover
          // Não precisa adicionar ao bonus porque o bonus já foi usado nas apostas
          bonusBloqueadoFinal = 0
        }

        const updateData: any = {
          saldo: saldoFinal,
          bonus: bonusFinal,
          rolloverAtual: { increment: valorTotalParaDebitar },
        }
        
        // Atualizar bonusBloqueado apenas se mudou
        if (bonusBloqueadoFinal !== (usuario.bonusBloqueado || 0)) {
          updateData.bonusBloqueado = bonusBloqueadoFinal
        }
        
        // Se completou o rollover, zerar rolloverNecessario também
        if (novoRolloverAtual >= rolloverNecessario && rolloverNecessario > 0) {
          updateData.rolloverNecessario = 0
        }
        
        // Marcar que já apostou com saldo real se debitou saldo
        if (debitarSaldo > 0 && !usuario.jaApostouComSaldoReal) {
          updateData.jaApostouComSaldoReal = true
        }
        
        // Marcar que já apostou (saldo ou bônus)
        if ((debitarSaldo > 0 || debitarBonus > 0) && !usuario.jaApostou) {
          updateData.jaApostou = true
        }
        
        await tx.usuario.update({
          where: { id: user.id },
          data: updateData,
        })
        
        if (bonusBloqueadoFinal === 0 && (usuario.bonusBloqueado || 0) > 0) {
          console.log(`✅ Bônus bloqueado liberado após completar rollover`)
        }
      } else {
        // Aposta normal (não instantânea)
        // Calcular novo rollover após incrementar
        const novoRolloverAtual = (usuario.rolloverAtual || 0) + valorTotalParaDebitar
        const rolloverNecessario = usuario.rolloverNecessario || 0
        
        // Se completou o rollover, liberar bônus bloqueado
        let bonusBloqueadoFinal = usuario.bonusBloqueado || 0
        
        if (bonusBloqueadoFinal > 0 && novoRolloverAtual >= rolloverNecessario && rolloverNecessario > 0) {
          // Liberar todo o bônus bloqueado quando completar o rollover
          // Não precisa adicionar ao bonus porque o bonus já foi usado nas apostas
          bonusBloqueadoFinal = 0
        }
        
        // Calcular bônus final: apenas debitar o usado
        const bonusAtual = usuario.bonus || 0
        const bonusFinal = bonusAtual - debitarBonus
        
        const updateData: any = {
          rolloverAtual: { increment: valorTotalParaDebitar },
        }
        
        // Atualizar saldo apenas se houver débito
        if (debitarSaldo > 0) {
          updateData.saldo = { decrement: debitarSaldo }
        }
        
        // Atualizar bônus apenas se mudou
        if (bonusFinal !== bonusAtual) {
          updateData.bonus = bonusFinal
        }
        
        // Atualizar bonusBloqueado apenas se mudou
        if (bonusBloqueadoFinal !== (usuario.bonusBloqueado || 0)) {
          updateData.bonusBloqueado = bonusBloqueadoFinal
        }
        
        // Se completou o rollover, zerar rolloverNecessario também
        if (novoRolloverAtual >= rolloverNecessario && rolloverNecessario > 0) {
          updateData.rolloverNecessario = 0
        }
        
        // Marcar que já apostou com saldo real se debitou saldo
        if (debitarSaldo > 0 && !usuario.jaApostouComSaldoReal) {
          updateData.jaApostouComSaldoReal = true
        }
        
        // Marcar que já apostou (saldo ou bônus)
        if ((debitarSaldo > 0 || debitarBonus > 0) && !usuario.jaApostou) {
          updateData.jaApostou = true
        }
        
        await tx.usuario.update({
          where: { id: user.id },
          data: updateData,
        })
        
        if (bonusBloqueadoFinal === 0 && (usuario.bonusBloqueado || 0) > 0) {
          console.log(`✅ Bônus bloqueado liberado após completar rollover`)
        }
      }

      // Preparar detalhes como JSON string
      const detalhesObj = {
        ...(detalhes && typeof detalhes === 'object' ? detalhes : {}),
        resultadoInstantaneo: resultadoInstantaneo,
        premioTotal,
      }
      const detalhesString = JSON.stringify(detalhesObj)

      // IMPORTANTE: O valor salvo na aposta deve ser o valor POR EXTRAÇÃO
      // Exemplo: R$ 2,00 por extração, 3 extrações = cada aposta salva R$ 2,00
      // O valorTotalParaDebitar é o total que será debitado da conta (R$ 6,00)
      // Mas cada aposta individual salva o valor por extração (R$ 2,00)
      let valorParaSalvar = valorNum // Valor por extração (valor digitado)
      
      // Se "para cada palpite" (each): multiplicar pelo número de palpites também
      if (detalhes && typeof detalhes === 'object' && 'betData' in detalhes) {
        const betData = (detalhes as any).betData
        if (betData.divisionType === 'each') {
          const qtdPalpites = betData.isNumberModality 
            ? (betData.numberBets?.length || 0)
            : (betData.animalBets?.length || 0)
          valorParaSalvar = valorParaSalvar * qtdPalpites
        }
      }

      const created = await tx.aposta.create({
        data: {
          usuarioId: user.id,
          concurso: concurso || null,
          loteria: loteria || null,
          estado: estado || null,
          horario: horario || null,
          dataConcurso: dataConcurso ? new Date(dataConcurso) : null,
          modalidade: modalidade || null,
          aposta: aposta || null,
          valor: valorParaSalvar, // Salvar o valor por aposta (dividido pelas posições)
          retornoPrevisto: premioTotal > 0 ? premioTotal : (retornoPrevisto ? Number(retornoPrevisto) : 0),
          // Aposta instantânea: liquidado se ganhou, perdida se não ganhou
          // Aposta normal: pendente até ser liquidada pelo cron
          status: isInstant ? (premioTotal > 0 ? 'liquidado' : 'perdida') : (status || 'pendente'),
          detalhes: detalhesString,
          updatedAt: new Date(),
        },
      })

      // Rastrear aposta no Meta Pixel (Conversions API)
      const modalityName = modalidade || 'Jogo do Bicho'
      MetaTrackingServer.trackBet(user.id, valorNum, modalityName).catch(err => {
        console.error('Erro ao rastrear aposta no Meta Pixel:', err)
      })

      // Enviar webhook de aposta
      WebhookTracker.aposta(
        user.id,
        created.id,
        valorNum,
        modalityName,
        isInstant ? (premioTotal > 0 ? 'liquidado' : 'perdida') : 'pendente'
      ).catch(err => {
        console.error('Erro ao enviar webhook de aposta:', err)
      })

      // Capturar IP e geolocalizar (não bloquear o fluxo se falhar)
      const clientIP = getClientIP(request)
      console.log(`🔍 Capturando IP para aposta do usuário ${user.id}:`, clientIP)
      if (clientIP) {
        geolocateIP(clientIP)
          .then(geoData => {
            if (geoData) {
              console.log(`✅ Geolocalização bem-sucedida para IP ${clientIP}:`, geoData.cidade, geoData.estado, geoData.pais)
              return salvarLocalizacaoUsuario(user.id, clientIP, 'aposta', geoData)
            } else {
              console.warn(`⚠️ Geolocalização retornou null para IP ${clientIP}`)
            }
          })
          .catch(err => {
            console.error('❌ Erro ao geolocalizar IP na aposta:', err)
          })
      } else {
        console.warn(`⚠️ Não foi possível capturar IP para aposta do usuário ${user.id}`)
      }

      // Se aposta instantânea ganhou, enviar webhook de aposta ganha
      if (isInstant && premioTotal > 0) {
        WebhookTracker.apostaGanha(user.id, created.id, premioTotal).catch(err => {
          console.error('Erro ao enviar webhook de aposta ganha:', err)
        })
      }

      return { ...created, resultadoInstantaneo, premioTotal }
    })

    return NextResponse.json({ aposta: result }, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar aposta', error)
    const message = (error as Error).message || 'Erro ao criar aposta'
    const statusCode = message.includes('Saldo insuficiente') ? 400 : 500
    return NextResponse.json({ error: message }, { status: statusCode })
  }
}
