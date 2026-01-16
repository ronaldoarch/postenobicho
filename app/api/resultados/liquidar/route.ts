import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  conferirPalpite,
  calcularValorPorPalpite,
  type ModalityType,
  type InstantResult,
  calcularPremioUnidade,
  buscarOdd,
} from '@/lib/bet-rules-engine'
import { ANIMALS } from '@/data/animals'
import { ResultadoItem } from '@/types/resultados'
import { verificarMilharCotada, verificarCentenaCotada, extrairCentena } from '@/lib/cotacao'
import { extracoes } from '@/data/extracoes'

/**
 * GET /api/resultados/liquidar
 * 
 * Retorna estatísticas de apostas pendentes
 */
export async function GET() {
  try {
    const apostasPendentes = await prisma.aposta.count({
      where: { status: 'pendente' },
    })

    const apostasLiquidadas = await prisma.aposta.count({
      where: { status: 'liquidado' },
    })

    const apostasPerdidas = await prisma.aposta.count({
      where: { status: 'perdida' },
    })

    return NextResponse.json({
      pendentes: apostasPendentes,
      liquidadas: apostasLiquidadas,
      perdidas: apostasPerdidas,
      total: apostasPendentes + apostasLiquidadas + apostasPerdidas,
    })
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error)
    return NextResponse.json({ error: 'Erro ao buscar estatísticas' }, { status: 500 })
  }
}

/**
 * Endpoint para liquidação automática de apostas pendentes
 * 
 * POST /api/resultados/liquidar
 * 
 * Body (opcional):
 * - loteria: filtrar por loteria específica
 * - dataConcurso: filtrar por data específica
 * - horario: filtrar por horário específico
 * - usarMonitor: se true, tenta usar sistema do monitor primeiro
 * 
 * Se não enviar parâmetros, processa todas as apostas pendentes
 * 
 * Estratégia:
 * 1. Se usarMonitor=true, tenta usar endpoint do monitor
 * 2. Se monitor não disponível ou falhar, usa implementação própria
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const { loteria, dataConcurso, horario, usarMonitor = false } = body

    // Tentar usar sistema do monitor se solicitado
    if (usarMonitor) {
      try {
        const SOURCE_ROOT = (
          process.env.BICHO_CERTO_API ?? 'https://okgkgswwkk8ows0csow0c4gg.agenciamidas.com/api/resultados'
        ).replace(/\/api\/resultados$/, '')

        const monitorResponse = await fetch(`${SOURCE_ROOT}/api/resultados/liquidar`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ loteria, dataConcurso, horario }),
          cache: 'no-store',
        })

        if (monitorResponse.ok) {
          const monitorData = await monitorResponse.json()
          console.log('✅ Liquidação processada pelo monitor:', monitorData)
          return NextResponse.json({
            ...monitorData,
            fonte: 'monitor',
          })
        }
      } catch (monitorError) {
        console.log('⚠️ Monitor não disponível, usando implementação própria:', monitorError)
        // Continua com implementação própria
      }
    }

    // Buscar apostas pendentes
    const whereClause: any = {
      status: 'pendente',
    }

    if (loteria) whereClause.loteria = loteria
    if (dataConcurso) whereClause.dataConcurso = new Date(dataConcurso)
    if (horario) whereClause.horario = horario

    const apostasPendentes = await prisma.aposta.findMany({
      where: whereClause,
      include: {
        usuario: {
          select: {
            id: true,
            saldo: true,
            bonus: true,
          },
        },
      },
    })

    if (apostasPendentes.length === 0) {
      return NextResponse.json({
        message: 'Nenhuma aposta pendente encontrada',
        processadas: 0,
        liquidadas: 0,
        premioTotal: 0,
      })
    }

    // Buscar resultados oficiais
    // Usar API interna primeiro (mais rápido), com fallback para API externa
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                   (request.headers.get('host') ? `https://${request.headers.get('host')}` : 'http://localhost:3000')
    
    let resultados: ResultadoItem[] = []
    let resultadosData: any = null
    
    try {
      // Tentar API interna primeiro (timeout de 30s)
      const resultadosResponse = await fetch(`${baseUrl}/api/resultados`, {
        cache: 'no-store',
        signal: AbortSignal.timeout(30000),
      })
      
      if (resultadosResponse.ok) {
        resultadosData = await resultadosResponse.json()
        resultados = resultadosData.results || resultadosData.resultados || []
      }
    } catch (error) {
      console.warn('⚠️ Erro ao buscar resultados da API interna, tentando API externa:', error)
    }
    
    // Fallback para API externa se necessário
    if (resultados.length === 0) {
      try {
    const resultadosResponse = await fetch(
      `${process.env.BICHO_CERTO_API ?? 'https://okgkgswwkk8ows0csow0c4gg.agenciamidas.com/api/resultados'}`,
          { 
            cache: 'no-store',
            signal: AbortSignal.timeout(30000),
          }
    )

        if (resultadosResponse.ok) {
          resultadosData = await resultadosResponse.json()
          resultados = resultadosData.results || resultadosData.resultados || []
        }
      } catch (error) {
        console.error('❌ Erro ao buscar resultados da API externa:', error)
      throw new Error('Erro ao buscar resultados oficiais')
      }
    }

    if (resultados.length === 0) {
      return NextResponse.json({
        message: 'Nenhum resultado oficial encontrado',
        processadas: 0,
        liquidadas: 0,
        premioTotal: 0,
      })
    }

    // Mapear nome da modalidade para tipo
    const modalityMap: Record<string, ModalityType> = {
      Grupo: 'GRUPO',
      'Dupla de Grupo': 'DUPLA_GRUPO',
      'Terno de Grupo': 'TERNO_GRUPO',
      'Quadra de Grupo': 'QUADRA_GRUPO',
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
      'Duque de Dezena (EMD)': 'DUQUE_DEZENA_EMD',
      'Terno de Dezena (EMD)': 'TERNO_DEZENA_EMD',
      'Dezeninha': 'DEZENINHA',
      'Terno de Grupo Seco': 'TERNO_GRUPO_SECO',
    }

    let processadas = 0
    let liquidadas = 0
    let premioTotalGeral = 0

    // Mapeamento flexível de nomes de extrações para encontrar resultados
    const extracaoNameMap: Record<string, string[]> = {
      'PT RIO': ['pt rio', 'PT RIO', 'pt rio de janeiro', 'pt-rio', 'pt-rio de janeiro', 'mpt-rio', 'mpt rio'],
      'PT BAHIA': ['pt bahia', 'pt-ba', 'maluca bahia'],
      'PT SP': ['pt sp', 'pt-sp', 'pt sp bandeirantes', 'pt-sp/bandeirantes', 'bandeirantes', 'pt sp (band)'],
      'LOOK': ['look', 'look goiás', 'look goias'],
      'LOTEP': ['lotep', 'pt paraiba/lotep', 'pt paraiba', 'pt paraíba', 'pt-pb'],
      'LOTECE': ['lotece', 'pt ceara', 'pt ceará'],
      'NACIONAL': ['nacional', 'loteria nacional'],
      'FEDERAL': ['federal', 'loteria federal'],
      'PARA TODOS': ['para todos'],
    }

    // Processar cada aposta
    for (const aposta of apostasPendentes) {
      try {
        // Verificar se já passou o horário de apuração
        if (aposta.loteria && aposta.horario && aposta.dataConcurso) {
          // Tentar encontrar extração por ID (se loteria for número) ou por nome
          const extracaoId = parseInt(aposta.loteria, 10)
          const extracao = !isNaN(extracaoId) 
            ? extracoes.find((e) => e.id === extracaoId)
            : extracoes.find((e) => e.name.toLowerCase() === aposta.loteria.toLowerCase())
          
          if (extracao && extracao.closeTime) {
            const hoje = new Date()
            const dataAposta = new Date(aposta.dataConcurso)
            const dataApostaStr = dataAposta.toISOString().split('T')[0]
            const hojeStr = hoje.toISOString().split('T')[0]
            
            // Se for hoje, verificar se já passou o horário de apuração
            if (dataApostaStr === hojeStr) {
              const [horaClose, minutoClose] = extracao.closeTime.split(':').map(Number)
              const horarioClose = new Date()
              horarioClose.setHours(horaClose || 0, minutoClose || 0, 0, 0)
              
              if (hoje < horarioClose) {
                console.log(`⏰ Ainda não passou o horário de apuração (${extracao.closeTime})`)
                console.log(`⏸️  Pulando aposta ${aposta.id} - aguardando apuração`)
                continue
              }
            }
          }
        }

        // Filtrar resultados por loteria/horário/data da aposta
        let resultadosFiltrados = resultados

        if (aposta.loteria) {
          // ============================================================================
          // PROBLEMA 2: Match flexível de nomes de extrações
          // ============================================================================
          const extracaoId = parseInt(aposta.loteria, 10)
          const extracao = !isNaN(extracaoId)
            ? extracoes.find((e) => e.id === extracaoId)
            : extracoes.find((e) => e.name.toLowerCase() === aposta.loteria.toLowerCase())
          const nomeExtracao = extracao?.name || aposta.loteria
          
          // Criar lista de nomes possíveis com variações conhecidas
          const nomeBase = nomeExtracao.toLowerCase().trim()
          const nomesPossiveis: string[] = [
            nomeBase,
            nomeExtracao, // Nome original
            nomeBase.replace(/\s+/g, ' '), // Normalizar espaços
            nomeBase.replace(/\s+/g, '-'), // Com hífen
            nomeBase.replace(/\s+/g, '/'), // Com barra
          ]
          
          // Adicionar variações específicas baseadas em nomes REAIS da API
          if (nomeBase.includes('pt rio')) {
            nomesPossiveis.push(
              'pt rio de janeiro',
              'pt-rio',
              'pt-rio de janeiro',
              'mpt-rio',
              'mpt rio',
              'maluquinha rj',
              'maluquinha rio de janeiro',
              'maluquinha'
            )
          }
          
          if (nomeBase.includes('pt sp')) {
            nomesPossiveis.push(
              'pt-sp/bandeirantes',
              'pt-sp bandeirantes',
              'pt sp bandeirantes',
              'bandeirantes',
              'band',
              'pt sp (band)',
              'pt-sp'
            )
          }
          
          if (nomeBase.includes('look')) {
            nomesPossiveis.push(
              'look goiás',
              'look goias',
              'look-go',
              'look'
            )
          }
          
          if (nomeBase.includes('lotep')) {
            nomesPossiveis.push(
              'pt paraiba/lotep',
              'pt paraiba',
              'pt paraíba',
              'pt-pb',
              'lotep'
            )
          }
          
          if (nomeBase.includes('lotece')) {
            nomesPossiveis.push(
              'lotece',
              'pt ceara',
              'pt ceará'
            )
          }
          
          // Adicionar mapeamento do extracaoNameMap se existir
          if (extracaoNameMap[nomeExtracao]) {
            nomesPossiveis.push(...extracaoNameMap[nomeExtracao])
          }
          
          const antes = resultadosFiltrados.length
          
          // Match flexível com múltiplas estratégias
          resultadosFiltrados = resultadosFiltrados.filter((r) => {
            const rLoteria = (r.loteria?.toLowerCase() || '').trim()
            
            // Normalizar ambos os lados
            const normalizar = (str: string) => 
              str.toLowerCase().trim().replace(/\s+/g, ' ').replace(/\//g, '/')
            const rLoteriaNormalizada = normalizar(rLoteria)
            
            const match = nomesPossiveis.some(nome => {
              const nomeLower = normalizar(nome)
              
              // 1. Match exato
              if (rLoteriaNormalizada === nomeLower) return true
              
              // 2. Match por inclusão (um contém o outro)
              if (rLoteriaNormalizada.includes(nomeLower) || 
                  nomeLower.includes(rLoteriaNormalizada)) return true
              
              // 3. Match por palavras-chave principais
              const palavrasNome = nomeLower.split(/\s+|-|\//).filter(p => p.length > 2)
              const palavrasLoteria = rLoteriaNormalizada.split(/\s+|-|\//).filter(p => p.length > 2)
              
              // Se pelo menos 2 palavras-chave principais coincidem
              if (palavrasNome.length >= 2 && palavrasLoteria.length >= 2) {
                const palavrasComuns = palavrasNome.filter(p => 
                  palavrasLoteria.some(pl => pl.includes(p) || p.includes(pl))
                )
                if (palavrasComuns.length >= 2) return true
              }
              
              // 4. Match por palavra-chave significativa única
              const palavrasSignificativas = [
                'bandeirantes', 'lotep', 'lotece', 'look', 'nacional', 'federal',
                'maluquinha', 'maluca', 'rio', 'janeiro', 'bahia', 'paraiba',
                'paraíba', 'ceara', 'ceará', 'goias', 'goiás', 'sp', 'são paulo'
              ]
              
              const temPalavraSignificativa = palavrasSignificativas.some(palavra => {
                return nomeLower.includes(palavra) && rLoteriaNormalizada.includes(palavra)
              })
              if (temPalavraSignificativa) return true
              
              return false
            })
            
            return match
          })
          
          // Fallback para match mais flexível se não encontrar
          if (resultadosFiltrados.length === 0 && antes > 0) {
            const palavrasChave = nomeExtracao.toLowerCase()
              .split(/\s+|-|\//)
              .filter(p => p.length > 2)
            
            if (palavrasChave.length > 0) {
              resultadosFiltrados = resultados.filter((r) => {
                const rLoteria = (r.loteria?.toLowerCase() || '').trim()
                return palavrasChave.some(palavra => rLoteria.includes(palavra))
              })
            }
            
            // Se ainda não encontrou, tentar sem filtro de loteria (usar todos)
            if (resultadosFiltrados.length === 0) {
              resultadosFiltrados = resultados // Usar todos os resultados
            }
          }
          
          console.log(`- Loteria ID ${extracaoId} → Nome: "${nomeExtracao}" (ativa: ${extracao?.active ?? true})`)
          console.log(`- Nomes possíveis para match: ${nomesPossiveis.slice(0, 5).join(', ')}...`)
          console.log(`- Após filtro de loteria "${nomeExtracao}": ${resultadosFiltrados.length} resultados (antes: ${antes})`)
        }

        // NOTA: Não filtrar por horário aqui, pois vamos agrupar por horário depois
        // O filtro de horário será feito no agrupamento para evitar misturar resultados

        if (aposta.dataConcurso) {
          // Normalizar formato de data da aposta (ISO: 2026-01-14)
          const dataAposta = aposta.dataConcurso.toISOString().split('T')[0]
          const [anoAposta, mesAposta, diaAposta] = dataAposta.split('-')
          const dataApostaFormatada = `${diaAposta}/${mesAposta}/${anoAposta}` // Formato BR: 14/01/2026
          
          resultadosFiltrados = resultadosFiltrados.filter((r) => {
            const dataResultado = r.date || r.dataExtracao || ''
            if (!dataResultado) return false
            
            // Comparar formato ISO (2026-01-14)
            if (dataResultado.split('T')[0] === dataAposta) return true
            
            // Comparar formato brasileiro (14/01/2026)
            if (dataResultado === dataApostaFormatada) return true
            
            // Comparação parcial (dia/mês/ano)
            const matchBR = dataResultado.match(/(\d{2})\/(\d{2})\/(\d{4})/)
            if (matchBR) {
              const [_, dia, mes, ano] = matchBR
              if (`${ano}-${mes}-${dia}` === dataAposta) return true
            }
            
            return false
          })
        }

        if (resultadosFiltrados.length === 0) {
          console.log(`Nenhum resultado encontrado para aposta ${aposta.id}`)
          continue
        }

        // ============================================================================
        // PROBLEMA 1: Agrupar por horário ANTES de selecionar prêmios
        // ============================================================================
        // Evita misturar prêmios de diferentes horários (ex: 1º de um horário + 2º de outro)
        const resultadosPorHorario = new Map<string, ResultadoItem[]>()

        resultadosFiltrados.forEach((r) => {
          if (r.position && r.milhar) {
            // IMPORTANTE: Incluir nome da loteria na chave para evitar misturar tabelas diferentes
            // Exemplo: LOTEP (PB) e LOTECE (CE) devem ser agrupados separadamente mesmo com mesmo horário
            const loteriaKey = r.loteria || ''
            const horarioKey = r.horario?.trim() || r.drawTime?.trim() || 'sem-horario'
            const key = `${loteriaKey}|${horarioKey}` // Chave composta
            
            if (!resultadosPorHorario.has(key)) {
              resultadosPorHorario.set(key, [])
            }
            resultadosPorHorario.get(key)!.push(r)
          }
        })

        // Selecionar o horário correto para a aposta
        let horarioSelecionado: string | null = null
        let resultadosDoHorario: ResultadoItem[] = []

        const horarioAposta = aposta.horario?.trim()
        if (horarioAposta && horarioAposta !== 'null') {
          // Tentar match exato primeiro
          for (const [horarioKey, resultados] of resultadosPorHorario.entries()) {
            const horarioKeyLower = horarioKey.toLowerCase()
            const horarioApostaLower = horarioAposta.toLowerCase()
            
            // Match exato
            if (horarioKeyLower.includes(horarioApostaLower) || 
                horarioApostaLower.includes(horarioKeyLower)) {
              horarioSelecionado = horarioKey
              resultadosDoHorario = resultados
              break
            }
            
            // Match por início (ex: "20:15" matcha "20:15:00")
            const horarioKeyOnly = horarioKey.split('|')[1] || horarioKey
            if (horarioKeyOnly.startsWith(horarioApostaLower) || 
                horarioApostaLower.startsWith(horarioKeyOnly)) {
              horarioSelecionado = horarioKey
              resultadosDoHorario = resultados
              break
            }
          }
        }

        // Se não encontrou match exato, buscar horário mais próximo
        if (resultadosDoHorario.length === 0) {
          const extracaoId = parseInt(aposta.loteria, 10)
          const extracao = !isNaN(extracaoId)
            ? extracoes.find((e) => e.id === extracaoId)
            : extracoes.find((e) => e.name.toLowerCase() === aposta.loteria?.toLowerCase())
          
          if (extracao) {
            // Coletar todos os horários possíveis da extração
            const horariosPossiveis: string[] = []
            if (extracao.time) horariosPossiveis.push(extracao.time)
            if (extracao.closeTime) horariosPossiveis.push(extracao.closeTime)
            
            // Tentar match com cada horário possível
            for (const horarioPossivel of horariosPossiveis) {
              for (const [horarioKey, resultados] of resultadosPorHorario.entries()) {
                const horarioKeyOnly = horarioKey.split('|')[1] || horarioKey
                if (horarioKeyOnly.includes(horarioPossivel) || 
                    horarioPossivel.includes(horarioKeyOnly)) {
                  horarioSelecionado = horarioKey
                  resultadosDoHorario = resultados
                  break
                }
              }
              if (resultadosDoHorario.length > 0) break
            }
          }
          
          // Fallback: usar o horário com mais resultados (geralmente é o mais recente)
          if (resultadosDoHorario.length === 0) {
            let maxResultados = 0
            for (const [horarioKey, resultados] of resultadosPorHorario.entries()) {
              if (resultados.length > maxResultados) {
                maxResultados = resultados.length
                horarioSelecionado = horarioKey
                resultadosDoHorario = resultados
              }
            }
          }
        }

        if (resultadosDoHorario.length === 0) {
          console.log(`Nenhum resultado válido encontrado para aposta ${aposta.id} após agrupamento por horário`)
          continue
        }

        // SÓ DEPOIS ordenar e pegar prêmios do horário selecionado
        const resultadosOrdenados = resultadosDoHorario
          .filter((r) => r.position && r.milhar)
          .sort((a, b) => {
            // Extrair número da posição (1º, 2º, etc.)
            const getPosNumber = (pos?: string): number => {
              if (!pos) return 999
              const match = pos.match(/(\d+)/)
              return match ? parseInt(match[1], 10) : 999
            }
            return getPosNumber(a.position) - getPosNumber(b.position)
          })
          .slice(0, 7) // Limitar a 7 prêmios

        if (resultadosOrdenados.length === 0) {
          console.log(`Nenhum resultado válido encontrado para aposta ${aposta.id}`)
          continue
        }

        // Converter para lista de milhares (formato esperado pelo motor)
        const milhares = resultadosOrdenados.map((r) => {
          const milharStr = (r.milhar || '0000').replace(/\D/g, '') // Remove não-dígitos
          return parseInt(milharStr.padStart(4, '0').slice(-4)) // Garante 4 dígitos
        })

        const grupos = milhares.map((m) => {
          const dezena = m % 100
          if (dezena === 0) return 25
          return Math.floor((dezena - 1) / 4) + 1
        })

        const resultadoOficial: InstantResult = {
          prizes: milhares,
          groups: grupos,
        }

        // Extrair dados da aposta
        const detalhes = aposta.detalhes as any
        if (!detalhes || !detalhes.betData) {
          console.log(`Aposta ${aposta.id} não tem betData`)
          continue
        }

        const betData = detalhes.betData as {
          modality: string | null
          modalityName?: string | null
          animalBets: number[][]
          position: string | null
          amount: number
          divisionType: 'all' | 'each'
        }

        const modalityType = modalityMap[betData.modalityName || aposta.modalidade || ''] || 'GRUPO'

        // Parsear posição (suporta posição personalizada)
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

        // Calcular valor por palpite
        const qtdPalpites = betData.animalBets.length
        const valorPorPalpite = calcularValorPorPalpite(
          betData.amount,
          qtdPalpites,
          betData.divisionType
        )

        // Conferir cada palpite
        let premioTotalAposta = 0

        for (const animalBet of betData.animalBets) {
          const gruposApostados = animalBet.map((animalId) => {
            const animal = ANIMALS.find((a) => a.id === animalId)
            if (!animal) {
              throw new Error(`Animal não encontrado: ${animalId}`)
            }
            return animal.group
          })

          let palpiteData: { grupos?: number[]; numero?: string } = {}

          if (
            modalityType.includes('GRUPO') ||
            modalityType === 'PASSE' ||
            modalityType === 'PASSE_VAI_E_VEM'
          ) {
            palpiteData = { grupos: gruposApostados }
          } else {
            // Para modalidades numéricas, precisaríamos do número apostado
            // Por enquanto, pulamos modalidades numéricas
            console.log(`Modalidade numérica ${modalityType} ainda não suportada na liquidação`)
            continue
          }

          const conferencia = conferirPalpite(
            resultadoOficial,
            modalityType,
            palpiteData,
            pos_from,
            pos_to,
            valorPorPalpite,
            betData.divisionType
          )

          // Verificar se milhar ou centena está cotada APENAS SE GANHOU
          // A verificação ocorre no momento da apuração, verificando o número que ganhou
          let premioFinal = conferencia.totalPrize
          
          if (conferencia.totalPrize > 0 && (modalityType === 'MILHAR' || modalityType === 'CENTENA' || modalityType === 'MILHAR_CENTENA')) {
            // Verificar cotações para cada prêmio que ganhou
            for (let pos = pos_from - 1; pos < pos_to && pos < resultadoOficial.prizes.length; pos++) {
              const premioGanho = resultadoOficial.prizes[pos]
              const premioStr = premioGanho.toString().padStart(4, '0')
              
              if (modalityType === 'MILHAR') {
                const milharCotada = await verificarMilharCotada(premioStr)
                if (milharCotada) {
                  // Aplicar redução de 1/6 apenas no prêmio desta posição
                  // Como já calculamos o prêmio total, aplicamos a redução proporcional
                  premioFinal = premioFinal / 6
                  break // Apenas precisa verificar uma vez
                }
              } else if (modalityType === 'CENTENA') {
                const centenaStr = premioStr.slice(-3)
                const centenaCotada = await verificarCentenaCotada(centenaStr)
                if (centenaCotada) {
                  premioFinal = premioFinal / 6
                  break
                }
              } else if (modalityType === 'MILHAR_CENTENA') {
                const milharCotada = await verificarMilharCotada(premioStr)
                const centenaStr = premioStr.slice(-3)
                const centenaCotada = await verificarCentenaCotada(centenaStr)
                if (milharCotada || centenaCotada) {
                  premioFinal = premioFinal / 6
                  break
                }
              }
            }
          }

          premioTotalAposta += premioFinal
        }

        // Atualizar aposta e saldo do usuário
        if (premioTotalAposta > 0) {
          await prisma.$transaction(async (tx) => {
            // Atualizar aposta
            await tx.aposta.update({
              where: { id: aposta.id },
              data: {
                status: 'liquidado',
                retornoPrevisto: premioTotalAposta,
                detalhes: {
                  ...detalhes,
                  resultadoOficial: resultadoOficial,
                  premioTotal: premioTotalAposta,
                  liquidadoEm: new Date().toISOString(),
                },
              },
            })

            // Creditar prêmio no saldo do usuário
            await tx.usuario.update({
              where: { id: aposta.usuarioId },
              data: {
                saldo: {
                  increment: premioTotalAposta,
                },
              },
            })
          })

          liquidadas++
          premioTotalGeral += premioTotalAposta
        } else {
          // Marcar como não ganhou
          await prisma.aposta.update({
            where: { id: aposta.id },
            data: {
              status: 'perdida',
              detalhes: {
                ...detalhes,
                resultadoOficial: resultadoOficial,
                premioTotal: 0,
                liquidadoEm: new Date().toISOString(),
              },
            },
          })
        }

        processadas++
      } catch (error) {
        console.error(`Erro ao processar aposta ${aposta.id}:`, error)
        // Continua processando outras apostas
      }
    }

    return NextResponse.json({
      message: 'Liquidação concluída',
      processadas,
      liquidadas,
      premioTotal: premioTotalGeral,
      fonte: 'proprio',
    })
  } catch (error) {
    console.error('Erro ao liquidar apostas:', error)
    return NextResponse.json(
      {
        error: 'Erro ao liquidar apostas',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    )
  }
}
