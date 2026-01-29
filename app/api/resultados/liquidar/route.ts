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
import { ANIMALS } from '@/data/animals'
import { ResultadoItem } from '@/types/resultados'
import { verificarMilharCotada, verificarCentenaCotada, extrairCentena } from '@/lib/cotacao'
import { extracoes, type Extracao } from '@/data/extracoes'
import { getHorarioRealApuracao, temSorteioNoDia } from '@/data/horarios-reais-apuracao'
// API antiga desativada - usando nova API do PosteNoBicho
// import { buscarResultadosPorNome } from '@/lib/bichocerto-parser'
// import { buscarResultadosRJ } from '@/lib/bichocerto-verificador-rj'
import { buscarResultadosRJPosteNoBicho, buscarResultadoFederalPosteNoBicho } from '@/lib/postenobicho-api-parser'
import { WebhookTracker } from '@/lib/webhook-tracker'

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
 * Verifica se já passou o horário de apuração para uma extração
 * 
 * IMPORTANTE: Esta função usa os horários REAIS de apuração,
 * não os horários internos do sistema.
 */
function jaPassouHorarioApuracao(
  extracaoId: number | string | null,
  dataConcurso: Date | null,
  horarioAposta: string | null = null,
  loteriaNome: string | null = null
): boolean {
  // Validação básica
  if (!extracaoId || !dataConcurso) {
    console.log('⚠️ Verificação de horário: sem extração ou data, permitindo liquidação')
    return true // Permite liquidar se não tem dados suficientes
  }
  
  // Buscar extração por ID
  let extracao = extracoes.find(e => e.id === Number(extracaoId))
  
  // Se não encontrou por ID ou há múltiplas extrações com mesmo nome, tentar pelo horário
  if (!extracao || (horarioAposta && extracoes.filter(e => e.id === Number(extracaoId)).length > 1)) {
    const extracoesComMesmoId = extracoes.filter(e => e.id === Number(extracaoId))
    if (horarioAposta && extracoesComMesmoId.length > 0) {
      extracao = extracoesComMesmoId.find(e => e.time === horarioAposta) || extracoesComMesmoId[0]
    }
  }
  
  if (!extracao) {
    console.log('⚠️ Verificação de horário: extração não encontrada, permitindo liquidação')
    return true
  }
  
  const nomeExtracao = loteriaNome || extracao.name || ''
  const horarioExtracao = horarioAposta || extracao.time || extracao.closeTime || ''
  
  let horarioReal = null
  let startTimeParaUsar = extracao.closeTime || extracao.time || ''
  let closeTimeParaUsar = extracao.closeTime || extracao.time || ''
  
  if (nomeExtracao && horarioExtracao) {
    try {
      horarioReal = getHorarioRealApuracao(nomeExtracao, horarioExtracao)
      
      if (horarioReal) {
        // Usar horário de apuração real, mas ajustar para :30 (30 minutos após o horário)
        const [horasClose, minutosClose] = horarioReal.closeTimeReal.split(':').map(Number)
        // Horário de início de busca: 30 minutos após o closeTime (ex: 09:10 -> 09:40, mas queremos 09:30)
        // Então pegamos a hora e colocamos :30
        startTimeParaUsar = `${horasClose.toString().padStart(2, '0')}:30`
        closeTimeParaUsar = horarioReal.closeTimeReal
        
        const diaSemana = dataConcurso.getDay()
        if (!temSorteioNoDia(horarioReal, diaSemana)) {
          const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
          console.log(`🚫 ${diasSemana[diaSemana]} não tem sorteio para ${horarioReal.name} ${horarioReal.time}`)
          return false
        }
      } else {
        // Se não encontrou horário real, usar horário interno mas ajustar para :30
        const [horasClose, minutosClose] = (extracao.closeTime || extracao.time || '').split(':').map(Number)
        if (!isNaN(horasClose)) {
          startTimeParaUsar = `${horasClose.toString().padStart(2, '0')}:30`
        }
        console.log(`⚠️ Horário real não encontrado para ${nomeExtracao} ${horarioExtracao}, usando horário interno ajustado para :30`)
      }
    } catch (error) {
      console.log(`⚠️ Erro ao buscar horário real: ${error}, usando horário interno`)
      // Fallback: ajustar para :30
      const [horasClose, minutosClose] = (extracao.closeTime || extracao.time || '').split(':').map(Number)
      if (!isNaN(horasClose)) {
        startTimeParaUsar = `${horasClose.toString().padStart(2, '0')}:30`
      }
    }
  }
  
  if (!startTimeParaUsar) {
    console.log('⚠️ Verificação de horário: sem startTime disponível, permitindo liquidação')
    return true
  }
  
  const [horas, minutos] = startTimeParaUsar.split(':').map(Number)
  
  if (isNaN(horas) || isNaN(minutos)) {
    console.log(`⚠️ Verificação de horário: startTime inválido "${startTimeParaUsar}", permitindo liquidação`)
    return true
  }
  
  const agoraUTC = new Date()
  const agoraBrasiliaStr = agoraUTC.toLocaleString('en-US', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
  
  const [dataPart, horaPart] = agoraBrasiliaStr.split(', ')
  const [mes, dia, ano] = dataPart.split('/')
  const [horaAtual, minutoAtual, segundoAtual] = horaPart.split(':')
  const agora = new Date(
    parseInt(ano),
    parseInt(mes) - 1,
    parseInt(dia),
    parseInt(horaAtual),
    parseInt(minutoAtual),
    parseInt(segundoAtual)
  )
  
  const dataConcursoBrasiliaStr = dataConcurso.toLocaleString('en-US', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
  const [mesConc, diaConc, anoConc] = dataConcursoBrasiliaStr.split('/')
  
  const dataApuracaoInicial = new Date(
    parseInt(anoConc),
    parseInt(mesConc) - 1,
    parseInt(diaConc),
    horas,
    minutos,
    0
  )
  
  const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate())
  const dataConcursoSemHora = new Date(
    parseInt(anoConc),
    parseInt(mesConc) - 1,
    parseInt(diaConc)
  )
  
  if (dataConcursoSemHora.getTime() === hoje.getTime()) {
    const jaPassouHorarioInicial = agora >= dataApuracaoInicial
    
    const horaApuracaoInicial = `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`
    const horaAtualStr = `${agora.getHours().toString().padStart(2, '0')}:${agora.getMinutes().toString().padStart(2, '0')}:${agora.getSeconds().toString().padStart(2, '0')}`
    
    const fonteHorario = horarioReal ? '(horário real)' : '(interno)'
    console.log(`⏰ Verificação de horário: ${extracao.name} (ID ${extracaoId})`)
    console.log(`   startTime: ${startTimeParaUsar} | closeTime: ${closeTimeParaUsar} ${fonteHorario}`)
    console.log(`   Data apuração inicial: ${dataConcursoSemHora.toLocaleDateString('pt-BR')} ${horaApuracaoInicial}`)
    console.log(`   Agora: ${agora.toLocaleDateString('pt-BR')} ${horaAtualStr}`)
    console.log(`   ${jaPassouHorarioInicial ? '✅ Já pode tentar liquidar' : '⏸️  Ainda não passou o horário inicial'}`)
    
    return jaPassouHorarioInicial
  } else if (dataConcursoSemHora.getTime() < hoje.getTime()) {
    console.log('✅ Verificação de horário: data do concurso é passado, permitindo liquidação')
    return true
  } else {
    console.log('⏸️  Verificação de horário: data do concurso é futuro, bloqueando liquidação')
    return false
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
    // Verificar se a liquidação automática está ativa
    const configuracoes = await prisma.configuracao.findFirst()
    if (configuracoes && !configuracoes.liquidacaoAutomatica) {
      console.log('🚫 Liquidação automática está DESATIVADA nas configurações do admin')
      console.log('   Para ativar, vá em Admin > Configurações > Liquidação Automática')
      return NextResponse.json({
        message: 'Liquidação automática está desativada',
        processadas: 0,
        liquidadas: 0,
        premioTotal: 0,
        desativada: true,
      }, { status: 200 })
    }
    
    console.log('✅ Liquidação automática está ATIVADA - Processando apostas...')

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
    // FILTRO: Apenas apostas do Rio de Janeiro (RJ)
    const whereClause: any = {
      status: 'pendente',
    }

    if (loteria) whereClause.loteria = loteria
    if (dataConcurso) whereClause.dataConcurso = new Date(dataConcurso)
    if (horario) whereClause.horario = horario

    // Buscar todas as apostas pendentes primeiro
    let todasApostasPendentes = await prisma.aposta.findMany({
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

    // FILTRO: Filtrar apenas apostas do Rio de Janeiro (RJ)
    const apostasPendentes = todasApostasPendentes.filter((aposta) => {
      if (!aposta.loteria) return false
      
      // Buscar extração pelo ID ou nome
      const extracaoId = parseInt(aposta.loteria, 10)
      const extracao = !isNaN(extracaoId)
        ? extracoes.find((e) => e.id === extracaoId)
        : extracoes.find((e) => e.name.toLowerCase() === aposta.loteria?.toLowerCase() || '')
      
      // Apenas processar apostas de extrações do Rio de Janeiro
      return extracao?.estado === 'RJ'
    })

    console.log(`📊 Total de apostas pendentes: ${todasApostasPendentes.length}, do RJ: ${apostasPendentes.length}`)

    if (apostasPendentes.length === 0) {
      // Verificar por que não há apostas para processar
      const apostasSemLoteria = todasApostasPendentes.filter(a => !a.loteria).length
      const apostasForaRJ = todasApostasPendentes.filter(a => {
        if (!a.loteria) return false
        const extracaoId = parseInt(a.loteria, 10)
        const extracao = !isNaN(extracaoId)
          ? extracoes.find((e) => e.id === extracaoId)
          : extracoes.find((e) => e.name.toLowerCase() === a.loteria?.toLowerCase() || '')
        return extracao?.estado !== 'RJ'
      }).length

      return NextResponse.json({
        message: 'Nenhuma aposta pendente encontrada para processar',
        processadas: 0,
        liquidadas: 0,
        premioTotal: 0,
        debug: {
          totalApostasPendentes: todasApostasPendentes.length,
          apostasSemLoteria,
          apostasForaRJ,
          apostasDoRJ: apostasPendentes.length,
          motivo: todasApostasPendentes.length === 0 
            ? 'Nenhuma aposta pendente no banco de dados'
            : apostasSemLoteria > 0
            ? `${apostasSemLoteria} apostas sem loteria configurada`
            : apostasForaRJ > 0
            ? `${apostasForaRJ} apostas de estados diferentes de RJ (apenas RJ é processado)`
            : 'Todas as apostas pendentes foram filtradas'
        },
      })
    }

    // Buscar resultados oficiais usando parser do bichocerto.com
    let resultados: ResultadoItem[] = []
    
    try {
      // Agrupar apostas por loteria e data para buscar resultados de forma eficiente
      const apostasPorLoteriaData = new Map<string, { loteria: string, data: string }>()
      
      apostasPendentes.forEach(aposta => {
        if (aposta.loteria && aposta.dataConcurso) {
          const dataStr = aposta.dataConcurso.toISOString().split('T')[0]
          const key = `${aposta.loteria}|${dataStr}`
          if (!apostasPorLoteriaData.has(key)) {
            apostasPorLoteriaData.set(key, {
              loteria: aposta.loteria,
              data: dataStr
            })
          }
        }
      })
      
      // Buscar resultados de cada loteria/data única
      // FILTRO: Apenas extrações do Rio de Janeiro (RJ)
      const promessasResultados = Array.from(apostasPorLoteriaData.values())
        .filter(({ loteria }) => {
          // Filtrar apenas loterias do RJ antes de buscar resultados
          const extracaoId = parseInt(loteria, 10)
          const extracao = !isNaN(extracaoId)
            ? extracoes.find((e) => e.id === extracaoId)
            : extracoes.find((e) => e.name.toLowerCase() === loteria.toLowerCase())
          
          if (!extracao) {
            return false
          }
          
          // Apenas processar extrações do Rio de Janeiro
          if (extracao.estado !== 'RJ') {
            console.log(`⏭️  Pulando busca de resultados para ${extracao.name} - Estado: ${extracao.estado} (apenas RJ permitido)`)
            return false
          }
          
          return true
        })
        .map(async ({ loteria, data }) => {
        try {
          // Buscar extração para obter nome da loteria
          const extracaoId = parseInt(loteria, 10)
          const extracao = !isNaN(extracaoId)
            ? extracoes.find((e) => e.id === extracaoId)
            : extracoes.find((e) => e.name.toLowerCase() === loteria.toLowerCase())
          
          if (!extracao) {
            console.warn(`⚠️ Extração não encontrada para loteria: ${loteria}`)
            return []
          }
          
          // FILTRO: Apenas processar extrações do Rio de Janeiro (dupla verificação)
          if (extracao.estado !== 'RJ') {
            console.log(`⏭️  Pulando extração ${extracao.name} - Estado: ${extracao.estado} (apenas RJ permitido)`)
            return []
          }
          
          // Buscar resultados da nova API do PosteNoBicho
          // Para RJ: buscar horários 09, 11, 14, 16, 18, 21
          // Para Federal: buscar horário 18
          let resultadosConvertidos: ResultadoItem[] = []
          
          if (extracao.estado === 'RJ') {
            // Buscar todos os horários do RJ para a data
            const resultadosRJ = await buscarResultadosRJPosteNoBicho(data)
            
            resultadosRJ.forEach(resultado => {
              resultado.premios.forEach(premio => {
                // Usar dados diretamente do JSON - grupo vem da API
                resultadosConvertidos.push({
                  position: `${premio.posicao}º`,
                  posicao: premio.posicao,
                  milhar: premio.milhar, // Manter como vem da API
                  grupo: premio.grupo || '', // Grupo que vem da API (ex: "20", "18", "05")
                  animal: premio.animal,
                  drawTime: resultado.horario,
                  horario: resultado.horario,
                  loteria: extracao.name,
                  date: data,
                  dataExtracao: data,
                  estado: extracao.estado,
                  fonte: 'api.postenobicho.com',
                })
              })
            })
          } else if (extracao.name.toUpperCase().includes('FEDERAL')) {
            // Buscar resultado da Federal (horário 18)
            const resultadoFederal = await buscarResultadoFederalPosteNoBicho(data)
            
            if (resultadoFederal) {
              resultadoFederal.premios.forEach(premio => {
                // Usar dados diretamente do JSON - grupo vem da API
                resultadosConvertidos.push({
                  position: `${premio.posicao}º`,
                  posicao: premio.posicao,
                  milhar: premio.milhar, // Manter como vem da API
                  grupo: premio.grupo || '', // Grupo que vem da API
                  animal: premio.animal,
                  drawTime: resultadoFederal.horario,
                  horario: resultadoFederal.horario,
                  loteria: extracao.name,
                  date: data,
                  dataExtracao: data,
                  estado: extracao.estado,
                  fonte: 'api.postenobicho.com',
                })
              })
            }
          }
          
          return resultadosConvertidos
        } catch (error) {
          console.error(`❌ Erro ao buscar resultados para ${loteria} em ${data}:`, error)
          return []
        }
      })
      
      const resultadosArrays = await Promise.all(promessasResultados)
      resultados = resultadosArrays.flat()
      
      console.log(`📊 Total de resultados encontrados: ${resultados.length}`)
    } catch (error) {
      console.error('❌ Erro ao buscar resultados do bichocerto.com:', error)
      throw new Error('Erro ao buscar resultados oficiais')
    }

    if (resultados.length === 0) {
      return NextResponse.json({
        message: 'Nenhum resultado oficial encontrado para as apostas pendentes',
        processadas: 0,
        liquidadas: 0,
        premioTotal: 0,
        debug: {
          apostasPendentes: apostasPendentes.length,
          motivo: 'Não foi possível buscar resultados oficiais do bichocerto.com para as datas das apostas',
        },
      })
    }

    // Mapear nome da modalidade para tipo
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
    // FILTRO: Apenas apostas do Rio de Janeiro já foram filtradas na query acima
    for (const aposta of apostasPendentes) {
      try {
        // Verificar se já passou o horário de apuração
        const extracaoId = aposta.loteria ? Number(aposta.loteria) : null
        const horarioApostaInicial = aposta.horario && aposta.horario !== 'null' ? aposta.horario : null
        
        if (!jaPassouHorarioApuracao(extracaoId, aposta.dataConcurso, horarioApostaInicial)) {
          console.log(`⏸️  Pulando aposta ${aposta.id} - aguardando apuração (horário ainda não passou)`)
          continue // Pular esta aposta
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
            : extracoes.find((e) => e.name.toLowerCase() === aposta.loteria?.toLowerCase() || '')
          
          // FILTRO: Apenas processar apostas de extrações do Rio de Janeiro (dupla verificação)
          if (!extracao || extracao.estado !== 'RJ') {
            console.log(`⏭️  Pulando aposta ${aposta.id} - Extração não é do RJ (Estado: ${extracao?.estado || 'N/A'})`)
            continue
          }
          
          // Garantir que apenas resultados do RJ sejam usados
          resultadosFiltrados = resultadosFiltrados.filter((r) => 
            (r.estado || '').toUpperCase() === 'RJ'
          )
          
          const nomeExtracao = extracao.name || aposta.loteria || ''
          
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

        const horarioAposta = aposta.horario?.trim() || null
        if (horarioAposta && horarioAposta !== 'null') {
          // Tentar match exato primeiro
          for (const [horarioKey, resultados] of Array.from(resultadosPorHorario.entries())) {
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
        if (resultadosDoHorario.length === 0 && aposta.loteria) {
          const extracaoId = parseInt(aposta.loteria, 10)
          const extracao = !isNaN(extracaoId)
            ? extracoes.find((e) => e.id === extracaoId)
            : extracoes.find((e) => e.name.toLowerCase() === aposta.loteria?.toLowerCase() || '')
          
          if (extracao) {
            // Coletar todos os horários possíveis da extração
            const horariosPossiveis: string[] = []
            if (extracao.time) horariosPossiveis.push(extracao.time)
            if (extracao.closeTime) horariosPossiveis.push(extracao.closeTime)
            
            // Tentar match com cada horário possível
            for (const horarioPossivel of horariosPossiveis) {
              for (const [horarioKey, resultados] of Array.from(resultadosPorHorario.entries())) {
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

        // Nova Estratégia: Match por Hora (ex: "11:20" matcha "11:00")
        // Resolve o problema onde a API retorna "11:00" e a aposta é "11:20"
        if (resultadosDoHorario.length === 0 && horarioAposta) {
          const horaAposta = horarioAposta.split(':')[0] // "11"
          
          for (const [horarioKey, resultados] of Array.from(resultadosPorHorario.entries())) {
            const horarioKeyOnly = horarioKey.split('|')[1] || horarioKey // "11:00"
            const horaResult = horarioKeyOnly.split(':')[0] // "11"
            
            if (horaAposta === horaResult) {
              horarioSelecionado = horarioKey
              resultadosDoHorario = resultados
              console.log(`✅ Match por hora: Aposta ${horarioAposta} -> Resultado ${horarioKeyOnly}`)
              break
            }
          }
        }
          
        // Fallback: usar o horário com mais resultados (geralmente é o mais recente)
        if (resultadosDoHorario.length === 0) {
            let maxResultados = 0
            for (const [horarioKey, resultados] of Array.from(resultadosPorHorario.entries())) {
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
        // IMPORTANTE: Para RJ, 6º e 7º prêmios são centenas (últimos 3 dígitos)
        // Usar dados diretamente do JSON sem adicionar zeros
        const isRJ = aposta.loteria && (
          aposta.loteria.toUpperCase().includes('RIO') || 
          aposta.loteria.toUpperCase().includes('RJ')
        )
        
        const milhares = resultadosOrdenados.map((r, index) => {
          const milharStr = (r.milhar || '0').replace(/\D/g, '') // Remove não-dígitos
          let milharNum = parseInt(milharStr, 10)
          
          // Para RJ: 6º e 7º prêmios são centenas (últimos 3 dígitos)
          // Mas manter o número como vem da API (sem padding)
          if (isRJ && (index === 5 || index === 6)) {
            // Pegar apenas os últimos 3 dígitos (centena)
            milharNum = milharNum % 1000
          }
          
          return milharNum
        })

        const grupos = milhares.map((m, index) => {
          // Para RJ: 6º e 7º prêmios são centenas, então usar centena para calcular grupo
          if (isRJ && (index === 5 || index === 6)) {
            const centena = m % 1000
            const dezena = centena % 100
            if (dezena === 0) return 25
            return Math.floor((dezena - 1) / 4) + 1
          }
          
          const dezena = m % 100
          if (dezena === 0) return 25
          return Math.floor((dezena - 1) / 4) + 1
        })

        const resultadoOficial: InstantResult = {
          prizes: milhares,
          groups: grupos,
        }

        // Extrair dados da aposta (parse JSON se for string)
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
          console.log(`Aposta ${aposta.id} não tem betData`)
          continue
        }

        const betData = detalhes.betData as {
          modality: string | null
          modalityName?: string | null
          animalBets?: number[][]
          numberBets?: string[]
          numeroApostado?: string // Para modalidades numéricas
          position: string | null
          customPosition?: boolean
          customPositionValue?: string
          amount: number
          divisionType: 'all' | 'each'
          isNumberModality?: boolean
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
        // IMPORTANTE: Considerar tanto animalBets quanto numberBets
        const isNumberModality = betData.isNumberModality || (betData.numberBets && betData.numberBets.length > 0) || !!betData.numeroApostado
        const qtdPalpites = isNumberModality 
          ? (betData.numberBets?.length || (betData.numeroApostado ? 1 : 0) || 0)
          : (betData.animalBets?.length || 0)
        
        if (qtdPalpites === 0) {
          console.log(`Aposta ${aposta.id} não tem palpites válidos, pulando.`)
          continue
        }
        
        const valorPorPalpite = calcularValorPorPalpite(
          betData.amount,
          qtdPalpites,
          betData.divisionType
        )

        // Conferir cada palpite
        let premioTotalAposta = 0

        // Processar palpites de animais (se houver)
        if (betData.animalBets && betData.animalBets.length > 0) {
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
          } else if (
            modalityType === 'QUADRA_DEZENA' ||
            modalityType === 'DUQUE_DEZENA' ||
            modalityType === 'DUQUE_DEZENA_EMD' ||
            modalityType === 'TERNO_DEZENA' ||
            modalityType === 'TERNO_DEZENA_EMD'
          ) {
            // Para modalidades de dezena, precisamos do número apostado
            if (betData.numeroApostado) {
              palpiteData = { numero: betData.numeroApostado }
            } else {
              // Fallback: tentar converter grupos em dezenas
              // Cada grupo representa 4 dezenas, então pegamos a primeira dezena do grupo
              if (gruposApostados.length > 0) {
                const dezenas: string[] = []
                gruposApostados.forEach(grupo => {
                  // Converter grupo para dezenas (grupo 1 = dezenas 01-04, grupo 2 = 05-08, etc.)
                  const dezenasDoGrupo = grupoParaDezenas(grupo)
                  dezenasDoGrupo.forEach(d => {
                    const dezenaStr = d.toString().padStart(2, '0')
                    if (!dezenas.includes(dezenaStr)) {
                      dezenas.push(dezenaStr)
                    }
                  })
                })
                if (dezenas.length > 0) {
                  palpiteData = { numero: dezenas.join(',') }
                } else {
                  console.log(`Modalidade ${modalityType} requer número apostado, mas não encontrado na aposta ${aposta.id}`)
                  continue
                }
              } else {
                console.log(`Modalidade ${modalityType} requer número apostado, mas não encontrado na aposta ${aposta.id}`)
                continue
              }
            }
          } else if (
            modalityType === 'DEZENA' ||
            modalityType === 'CENTENA' ||
            modalityType === 'MILHAR' ||
            modalityType === 'DEZENA_INVERTIDA' ||
            modalityType === 'CENTENA_INVERTIDA' ||
            modalityType === 'MILHAR_INVERTIDA' ||
            modalityType === 'MILHAR_CENTENA' ||
            modalityType === 'DEZENINHA'
          ) {
            // Para modalidades numéricas, tentar usar número apostado ou converter grupos
            if (betData.numeroApostado) {
              palpiteData = { numero: betData.numeroApostado }
            } else if (gruposApostados.length > 0) {
              // Converter grupos em números
              // Para dezena: usar primeira dezena do grupo
              // Para centena/milhar: usar grupo como base (ex: grupo 1 = 0100 ou 0001)
              if (modalityType === 'DEZENA' || modalityType === 'DEZENA_INVERTIDA') {
                const dezenas: string[] = []
                gruposApostados.forEach(grupo => {
                  const dezenasDoGrupo = grupoParaDezenas(grupo)
                  dezenasDoGrupo.forEach(d => {
                    const dezenaStr = d.toString().padStart(2, '0')
                    if (!dezenas.includes(dezenaStr)) {
                      dezenas.push(dezenaStr)
                    }
                  })
                })
                if (dezenas.length > 0) {
                  palpiteData = { numero: dezenas[0] } // Usar primeira dezena
                } else {
                  console.log(`Modalidade ${modalityType} requer número apostado, mas não encontrado na aposta ${aposta.id}`)
                  continue
                }
              } else {
                // Para centena/milhar, usar grupo como base
                // Exemplo: grupo 1 = dezena 01, então centena = 001, milhar = 0001
                const grupo = gruposApostados[0]
                const dezenasDoGrupo = grupoParaDezenas(grupo)
                const primeiraDezena = dezenasDoGrupo[0].toString().padStart(2, '0')
                
                if (modalityType === 'CENTENA' || modalityType === 'CENTENA_INVERTIDA') {
                  palpiteData = { numero: `0${primeiraDezena}` } // Centena: 001, 002, etc.
                } else if (modalityType === 'MILHAR' || modalityType === 'MILHAR_INVERTIDA' || modalityType === 'MILHAR_CENTENA') {
                  palpiteData = { numero: `00${primeiraDezena}` } // Milhar: 0001, 0002, etc.
                } else if (modalityType === 'DEZENINHA') {
                  // Dezeninha: múltiplas dezenas
                  const todasDezenas: string[] = []
                  gruposApostados.forEach(grupo => {
                    const dezenasDoGrupo = grupoParaDezenas(grupo)
                    dezenasDoGrupo.forEach(d => {
                      const dezenaStr = d.toString().padStart(2, '0')
                      if (!todasDezenas.includes(dezenaStr)) {
                        todasDezenas.push(dezenaStr)
                      }
                    })
                  })
                  if (todasDezenas.length >= 3) {
                    palpiteData = { numero: todasDezenas.join(',') }
                  } else {
                    console.log(`Dezeninha requer pelo menos 3 dezenas, mas encontrado ${todasDezenas.length} na aposta ${aposta.id}`)
                    continue
                  }
                } else {
                  console.log(`Modalidade ${modalityType} requer número apostado, mas não encontrado na aposta ${aposta.id}`)
                  continue
                }
              }
            } else {
              console.log(`Modalidade ${modalityType} requer número apostado, mas não encontrado na aposta ${aposta.id}`)
              continue
            }
          } else {
            console.log(`Modalidade ${modalityType} ainda não suportada na liquidação`)
            continue
          }

          // Calcular prêmio normalmente primeiro
          const conferencia = await conferirPalpite(
            resultadoOficial,
            modalityType,
            palpiteData,
            pos_from,
            pos_to,
            valorPorPalpite,
            betData.divisionType,
            betData.modality ? parseInt(betData.modality) : undefined,
            betData.modalityName || undefined
          )

          // Verificar se milhar ou centena está cotada APENAS SE GANHOU
          // A cotação especial SUBSTITUI a odd normal, não multiplica o prêmio
          let premioFinal = conferencia.totalPrize
          
          if (conferencia.totalPrize > 0 && (modalityType === 'MILHAR' || modalityType === 'CENTENA' || modalityType === 'MILHAR_CENTENA')) {
            // Verificar cotações para cada prêmio que ganhou
            for (let pos = pos_from - 1; pos < pos_to && pos < resultadoOficial.prizes.length; pos++) {
              const premioGanho = resultadoOficial.prizes[pos]
              const premioStr = premioGanho.toString().padStart(4, '0')
              
              if (modalityType === 'MILHAR') {
                const { cotada, cotacao } = await verificarMilharCotada(premioStr)
                if (cotada) {
                  // A cotação especial substitui a odd normal
                  // Exemplo: se odd normal é 6000x e cotação é 1000x, recalcula usando 1000x
                  if (cotacao !== null && cotacao > 0) {
                    const { buscarOdd } = await import('@/lib/bet-rules-engine')
                    const oddNormal = await buscarOdd(modalityType, pos_from, pos_to, undefined, betData.modalityName || null)
                    // Recalcular: (cotacao_especial / odd_normal) * premio_calculado
                    premioFinal = (cotacao / oddNormal) * conferencia.totalPrize
                  } else {
                    // Sem cotação definida: aplica redução padrão de 1/6
                    premioFinal = conferencia.totalPrize / 6
                  }
                  break // Apenas precisa verificar uma vez
                }
              } else if (modalityType === 'CENTENA') {
                const centenaStr = premioStr.slice(-3)
                const { cotada, cotacao } = await verificarCentenaCotada(centenaStr)
                if (cotada) {
                  if (cotacao !== null && cotacao > 0) {
                    const { buscarOdd } = await import('@/lib/bet-rules-engine')
                    const oddNormal = await buscarOdd(modalityType, pos_from, pos_to, undefined, betData.modalityName || null)
                    premioFinal = (cotacao / oddNormal) * conferencia.totalPrize
                  } else {
                    premioFinal = conferencia.totalPrize / 6
                  }
                  break
                }
              } else if (modalityType === 'MILHAR_CENTENA') {
                const { cotada: milharCotada, cotacao: milharCotacao } = await verificarMilharCotada(premioStr)
                const centenaStr = premioStr.slice(-3)
                const { cotada: centenaCotada, cotacao: centenaCotacao } = await verificarCentenaCotada(centenaStr)
                if (milharCotada || centenaCotada) {
                  // Usa a cotação da milhar se disponível, senão usa da centena
                  const cotacaoUsar = milharCotacao ?? centenaCotacao
                  if (cotacaoUsar !== null && cotacaoUsar > 0) {
                    const { buscarOdd } = await import('@/lib/bet-rules-engine')
                    const oddNormal = await buscarOdd(modalityType, pos_from, pos_to, undefined, betData.modalityName || null)
                    premioFinal = (cotacaoUsar / oddNormal) * conferencia.totalPrize
                  } else {
                    premioFinal = conferencia.totalPrize / 6
                  }
                  break
                }
              }
            }
          }

          premioTotalAposta += premioFinal
          }
        }

        // Processar palpites numéricos (se houver)
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
              // Modalidades numéricas normais (Dezena, Centena, Milhar, Invertidas, Milhar/Centena)
              palpiteData = { numero: numberBet }
            }

            // Calcular prêmio normalmente primeiro
            const conferencia = await conferirPalpite(
              resultadoOficial,
              modalityType,
              palpiteData,
              pos_from,
              pos_to,
              valorPorPalpite,
              betData.divisionType,
              betData.modality ? parseInt(betData.modality) : undefined,
              betData.modalityName || undefined
            )

            // Verificar se milhar ou centena está cotada APENAS SE GANHOU
            let premioFinal = conferencia.totalPrize
            
            if (conferencia.totalPrize > 0 && (modalityType === 'MILHAR' || modalityType === 'CENTENA' || modalityType === 'MILHAR_CENTENA')) {
              // Verificar cotações para cada prêmio que ganhou
              for (let pos = pos_from - 1; pos < pos_to && pos < resultadoOficial.prizes.length; pos++) {
                const premioGanho = resultadoOficial.prizes[pos]
                const premioStr = premioGanho.toString().padStart(4, '0')
                
                if (modalityType === 'MILHAR') {
                  const { cotada, cotacao } = await verificarMilharCotada(premioStr)
                  if (cotada) {
                    if (cotacao !== null && cotacao > 0) {
                      const { buscarOdd } = await import('@/lib/bet-rules-engine')
                      const oddNormal = await buscarOdd(modalityType, pos_from, pos_to, undefined, betData.modalityName || null)
                      premioFinal = (cotacao / oddNormal) * conferencia.totalPrize
                    } else {
                      premioFinal = conferencia.totalPrize / 6
                    }
                    break
                  }
                } else if (modalityType === 'CENTENA') {
                  const centenaStr = premioStr.slice(-3)
                  const { cotada, cotacao } = await verificarCentenaCotada(centenaStr)
                  if (cotada) {
                    if (cotacao !== null && cotacao > 0) {
                      const { buscarOdd } = await import('@/lib/bet-rules-engine')
                      const oddNormal = await buscarOdd(modalityType, pos_from, pos_to, undefined, betData.modalityName || null)
                      premioFinal = (cotacao / oddNormal) * conferencia.totalPrize
                    } else {
                      premioFinal = conferencia.totalPrize / 6
                    }
                    break
                  }
                } else if (modalityType === 'MILHAR_CENTENA') {
                  const { cotada: milharCotada, cotacao: milharCotacao } = await verificarMilharCotada(premioStr)
                  const centenaStr = premioStr.slice(-3)
                  const { cotada: centenaCotada, cotacao: centenaCotacao } = await verificarCentenaCotada(centenaStr)
                  if (milharCotada || centenaCotada) {
                    const cotacaoUsar = milharCotacao ?? centenaCotacao
                    if (cotacaoUsar !== null && cotacaoUsar > 0) {
                      const { buscarOdd } = await import('@/lib/bet-rules-engine')
                      const oddNormal = await buscarOdd(modalityType, pos_from, pos_to, undefined, betData.modalityName || null)
                      premioFinal = (cotacaoUsar / oddNormal) * conferencia.totalPrize
                    } else {
                      premioFinal = conferencia.totalPrize / 6
                    }
                    break
                  }
                }
              }
            }

            premioTotalAposta += premioFinal
          }
        }

        // Atualizar aposta e saldo do usuário
        if (premioTotalAposta > 0) {
          await prisma.$transaction(async (tx) => {
            // Parse dos detalhes existentes (se for string JSON)
            let detalhesObj: any = {}
            if (detalhes) {
              if (typeof detalhes === 'string') {
                try {
                  detalhesObj = JSON.parse(detalhes)
                } catch (e) {
                  detalhesObj = {}
                }
              } else if (typeof detalhes === 'object') {
                detalhesObj = detalhes
              }
            }

            // Atualizar aposta
            await tx.aposta.update({
              where: { id: aposta.id },
              data: {
                status: 'liquidado',
                retornoPrevisto: premioTotalAposta,
                detalhes: JSON.stringify({
                  ...detalhesObj,
                  resultadoOficial: resultadoOficial,
                  premioTotal: premioTotalAposta,
                  liquidadoEm: new Date().toISOString(),
                }),
              },
            })

            // Buscar usuário para verificar rollover
            const usuarioPremio = await tx.usuario.findUnique({
              where: { id: aposta.usuarioId },
              select: {
                rolloverNecessario: true,
                rolloverAtual: true,
                bonusBloqueado: true,
              },
            })

            // Creditar prêmio no saldo do usuário e atualizar rollover
            const updateData: any = {
              saldo: {
                increment: premioTotalAposta,
              },
              // Incrementar rolloverAtual com o valor do prêmio ganho
              rolloverAtual: {
                increment: premioTotalAposta,
              },
            }

            // Se completou o rollover, liberar bônus bloqueado
            if (usuarioPremio) {
              const novoRolloverAtual = (usuarioPremio.rolloverAtual || 0) + premioTotalAposta
              const rolloverNecessario = usuarioPremio.rolloverNecessario || 0
              
              if (usuarioPremio.bonusBloqueado && usuarioPremio.bonusBloqueado > 0 && 
                  novoRolloverAtual >= rolloverNecessario && rolloverNecessario > 0) {
                // Liberar bônus bloqueado quando completar rollover
                updateData.bonusBloqueado = 0
                updateData.rolloverNecessario = 0
              }
            }

            await tx.usuario.update({
              where: { id: aposta.usuarioId },
              data: updateData,
            })
          })

          // Enviar webhook de aposta ganha
          WebhookTracker.apostaGanha(aposta.usuarioId, aposta.id, premioTotalAposta).catch(err => {
            console.error(`Erro ao enviar webhook de aposta ganha para aposta ${aposta.id}:`, err)
          })

          liquidadas++
          premioTotalGeral += premioTotalAposta
        } else {
          // Parse dos detalhes existentes (se for string JSON)
          let detalhesObj: any = {}
          if (detalhes) {
            if (typeof detalhes === 'string') {
              try {
                detalhesObj = JSON.parse(detalhes)
              } catch (e) {
                detalhesObj = {}
              }
            } else if (typeof detalhes === 'object') {
              detalhesObj = detalhes
            }
          }

          // Marcar como não ganhou
          await prisma.aposta.update({
            where: { id: aposta.id },
            data: {
              status: 'perdida',
              detalhes: JSON.stringify({
                ...detalhesObj,
                resultadoOficial: resultadoOficial,
                premioTotal: 0,
                liquidadoEm: new Date().toISOString(),
              }),
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
