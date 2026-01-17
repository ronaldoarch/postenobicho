import { NextRequest, NextResponse } from 'next/server'
import { ResultadosResponse, ResultadoItem } from '@/types/resultados'
import { toIsoDate } from '@/lib/resultados-helpers'
import { extracoes, type Extracao } from '@/data/extracoes'
import { getHorarioRealApuracao } from '@/data/horarios-reais-apuracao'
import { buscarResultadosPorNome, buscarResultadosBichoCerto } from '@/lib/bichocerto-parser'

// Flag para usar parser direto (desativa API antiga)
const USAR_BICHOCERTO_DIRETO = process.env.USAR_BICHOCERTO_DIRETO !== 'false'

const UF_NAME_MAP: Record<string, string> = {
  RJ: 'Rio de Janeiro',
  SP: 'São Paulo',
  BA: 'Bahia',
  PB: 'Paraíba',
  GO: 'Goiás',
  DF: 'Distrito Federal',
  CE: 'Ceará',
  MG: 'Minas Gerais',
  PR: 'Paraná',
  SC: 'Santa Catarina',
  RS: 'Rio Grande do Sul',
  BR: 'Nacional',
}

const LOTERIA_UF_MAP: Record<string, string> = {
  'pt rio de janeiro': 'RJ',
  'pt-rio de janeiro': 'RJ',
  'pt rio': 'RJ',
  'pt-rio': 'RJ',
  'mpt-rio': 'RJ',
  'mpt rio': 'RJ',
  'pt-sp/bandeirantes': 'SP',
  'pt sp': 'SP',
  'pt-sp': 'SP',
  'pt sp bandeirantes': 'SP',
  bandeirantes: 'SP',
  'pt bahia': 'BA',
  'pt-ba': 'BA',
  'maluca bahia': 'BA',
  'pt paraiba/lotep': 'PB',
  'pt paraiba': 'PB',
  'pt paraíba': 'PB',
  'pt-pb': 'PB',
  lotep: 'PB',
  'pt goias': 'GO',
  'pt goiás': 'GO',
  'look goias': 'GO',
  'look goiás': 'GO',
  look: 'GO',
  'pt ceara': 'CE',
  'pt ceará': 'CE',
  lotece: 'CE',
  'pt minas gerais': 'MG',
  'pt minas': 'MG',
  'pt parana': 'PR',
  'pt paraná': 'PR',
  'pt santa catarina': 'SC',
  'pt rio grande do sul': 'RS',
  'pt rs': 'RS',
  'loteria nacional': 'BR',
  nacional: 'BR',
  'loteria federal': 'BR',
  federal: 'BR',
  'para todos': 'BR',
}

const EXTRACAO_UF_MAP: Record<string, string> = {
  lotece: 'CE',
  lotep: 'PB',
  look: 'GO',
  'para todos': 'BR',
  'pt rio': 'RJ',
  nacional: 'BR',
  'pt bahia': 'BA',
  federal: 'BR',
  'pt sp': 'SP',
  'pt sp (band)': 'SP',
  'pt paraiba/lotep': 'PB',
  'pt paraiba': 'PB',
  'pt paraíba': 'PB',
  'pt ceara': 'CE',
  'pt ceará': 'CE',
}

const UF_ALIASES: Record<string, string> = {
  rj: 'RJ',
  'rio de janeiro': 'RJ',
  'pt rio': 'RJ',
  'pt-rio': 'RJ',
  'pt rio de janeiro': 'RJ',
  sp: 'SP',
  'sao paulo': 'SP',
  'são paulo': 'SP',
  'pt sp': 'SP',
  'pt-sp': 'SP',
  bandeirantes: 'SP',
  ba: 'BA',
  bahia: 'BA',
  'pt bahia': 'BA',
  'pt-ba': 'BA',
  go: 'GO',
  goias: 'GO',
  'goiás': 'GO',
  look: 'GO',
  'look goias': 'GO',
  'look goiás': 'GO',
  pb: 'PB',
  paraiba: 'PB',
  'paraíba': 'PB',
  lotep: 'PB',
  'pt paraiba': 'PB',
  ce: 'CE',
  ceara: 'CE',
  'ceará': 'CE',
  lotece: 'CE',
  mg: 'MG',
  minas: 'MG',
  pr: 'PR',
  parana: 'PR',
  'paraná': 'PR',
  sc: 'SC',
  'santa catarina': 'SC',
  rs: 'RS',
  'rio grande do sul': 'RS',
  df: 'DF',
  brasilia: 'DF',
  'brasília': 'DF',
  'distrito federal': 'DF',
  federal: 'BR',
  nacional: 'BR',
  'loteria federal': 'BR',
  'para todos': 'BR',
}

function normalizeText(value: string) {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function resolveUF(location?: string | null) {
  if (!location) return undefined
  const key = normalizeText(location)
  return UF_ALIASES[key] ?? (key.length === 2 ? key.toUpperCase() : undefined)
}

// Função buildUrl removida - não mais necessária com parser direto

/**
 * Normaliza o horário do resultado para o horário correto de fechamento da extração
 * 
 * @param loteriaNome Nome da loteria (ex: "PT SP", "LOOK", "LOTECE")
 * @param horarioResultado Horário que veio do resultado (ex: "20:40", "10:40")
 * @returns Horário normalizado para fechamento (ex: "20:15", "10:00") ou o horário original se não encontrar
 */
function normalizarHorarioResultado(
  loteriaNome: string,
  horarioResultado: string
): string {
  // Validação básica
  if (!loteriaNome || !horarioResultado) {
    return horarioResultado
  }
  
  // Normalizar nome da loteria
  const nomeNormalizado = loteriaNome.toUpperCase().trim()
  
  // Normalizar horário do resultado (formato HH:MM)
  const horarioNormalizado = horarioResultado
    .replace(/[h:]/g, ':')  // Substituir "h" por ":"
    .replace(/^(\d{1,2}):(\d{2})$/, (_, h, m) => {
      return `${h.padStart(2, '0')}:${m.padStart(2, '0')}`
    })
  
  // Converter para minutos para comparação
  const [horaResultado, minutoResultado] = horarioNormalizado.split(':').map(Number)
  
  if (isNaN(horaResultado) || isNaN(minutoResultado)) {
    return horarioResultado // Retorna original se inválido
  }
  
  const minutosResultado = horaResultado * 60 + minutoResultado
  
  // Buscar todas as extrações com esse nome
  const extracoesComMesmoNome = extracoes.filter(
    e => e.name.toUpperCase() === nomeNormalizado && e.active
  )
  
  if (extracoesComMesmoNome.length === 0) {
    return horarioResultado // Retorna original se não encontrar extração
  }
  
  let melhorMatch: { extracao: Extracao, diferenca: number } | null = null
  
  // Para cada extração, verificar se o horário do resultado corresponde ao horário real
  for (const extracao of extracoesComMesmoNome) {
    // Buscar horário real de apuração
    const horarioReal = getHorarioRealApuracao(extracao.name, extracao.time)
    
    if (horarioReal) {
      // Verificar match exato com closeTimeReal (horário quando o resultado deve estar disponível)
      const [horaFim, minutoFim] = horarioReal.closeTimeReal.split(':').map(Number)
      const minutosFim = horaFim * 60 + minutoFim
      
      // Match exato com closeTimeReal
      if (minutosResultado === minutosFim) {
        return extracao.time // Retorna horário interno normalizado
      }
      
      // Verificar se está dentro do intervalo de apuração
      const [horaInicio, minutoInicio] = horarioReal.startTimeReal.split(':').map(Number)
      const minutosInicio = horaInicio * 60 + minutoInicio
      
      if (minutosResultado >= minutosInicio && minutosResultado <= minutosFim) {
        // Calcular diferença para escolher o melhor match se houver múltiplos
        const diferenca = Math.abs(minutosResultado - minutosFim)
        if (!melhorMatch || diferenca < melhorMatch.diferenca) {
          melhorMatch = { extracao, diferenca }
        }
      }
    }
  }
  
  // Se encontrou match dentro do intervalo, retornar o melhor
  if (melhorMatch) {
    return melhorMatch.extracao.time
  }
  
  // Fallback: verificar match aproximado com horário interno (dentro de 30 minutos)
  for (const extracao of extracoesComMesmoNome) {
    const [horaExtracao, minutoExtracao] = extracao.time.split(':').map(Number)
    if (isNaN(horaExtracao) || isNaN(minutoExtracao)) continue
    
    const minutosExtracao = horaExtracao * 60 + minutoExtracao
    const diferenca = Math.abs(minutosResultado - minutosExtracao)
    
    if (diferenca <= 30) {
      return extracao.time
    }
  }
  
  // Se não encontrou match, retornar horário original
  return horarioResultado
}

function inferUfFromName(name?: string | null) {
  if (!name) return undefined
  const key = normalizeText(name)
  
  // ============================================================================
  // PROBLEMA 7: Priorizar mapeamentos específicos antes de mapeamentos gerais
  // ============================================================================
  // IMPORTANTE: Verificar EXTRACAO_UF_MAP primeiro para evitar confusão
  // Exemplo: LOTEP e LOTECE devem ser identificados corretamente
  if (EXTRACAO_UF_MAP[key]) {
    return EXTRACAO_UF_MAP[key]
  }
  
  // Verificar palavras-chave específicas
  if (key.includes('lotep') || key.includes('paraiba') || key.includes('paraíba')) {
    return 'PB'
  }
  if (key.includes('lotece') || key.includes('ceara') || key.includes('ceará')) {
    return 'CE'
  }
  
  // Fallback para mapeamentos gerais
  return (
    UF_ALIASES[key] ||
    LOTERIA_UF_MAP[key] ||
    (key.length === 2 ? key.toUpperCase() : undefined)
  )
}

function normalizeResults(raw: any[]): ResultadoItem[] {
  return raw.map((r: any, idx: number) => {
    const estado =
      r.estado || inferUfFromName(r.estado) || inferUfFromName(r.loteria) || inferUfFromName(r.local) || undefined
    const locationResolved = UF_NAME_MAP[estado || ''] || r.local || r.estado || r.cidade || r.uf || ''
    const dateValue = r.data || r.date || r.dia || r.data_extração || r.dataExtracao || ''

    return {
      position: r.position || r.premio || r.colocacao || `${idx + 1}°`,
      milhar: r.milhar || r.numero || r.milharNumero || r.valor || '',
      grupo: r.grupo || r.grupoNumero || '',
      animal: r.animal || r.nomeAnimal || '',
      drawTime: r.horario || r.drawTime || r.concurso || '',
      horario: r.horario || undefined,
      loteria: r.loteria || r.nomeLoteria || r.concurso || r.horario || '',
      location: locationResolved,
      date: dateValue,
      dataExtracao: dateValue,
      estado,
      posicao: r.posicao || (r.colocacao && parseInt(String(r.colocacao).replace(/\D/g, ''), 10)) || undefined,
      colocacao: r.colocacao || r.position || r.premio || `${idx + 1}°`,
      timestamp: r.timestamp || r.createdAt || r.updatedAt || undefined,
      fonte: r.fonte || r.origem || undefined,
      urlOrigem: r.url_origem || r.urlOrigem || r.link || undefined,
    }
  })
}

function orderByPosition(items: ResultadoItem[]) {
  const getOrder = (value?: string, pos?: number) => {
    if (typeof pos === 'number' && !Number.isNaN(pos)) return pos
    if (!value) return Number.MAX_SAFE_INTEGER
    const match = value.match(/(\d+)/)
    return match ? parseInt(match[1], 10) : Number.MAX_SAFE_INTEGER
  }
  return [...items].sort((a, b) => getOrder(a.position, a.posicao) - getOrder(b.position, b.posicao))
}

function matchesDateFilter(value: string | undefined, filter: string) {
  if (!filter) return true
  if (!value) return false

  const isoValue = toIsoDate(value)
  const isoFilter = toIsoDate(filter)

  const dayMonth = (v: string) => {
    const m = v.match(/(\d{2})\/(\d{2})/)
    return m ? `${m[1]}/${m[2]}` : undefined
  }
  const dmValue = dayMonth(value)
  const dmFilter = dayMonth(isoFilter)

  return (
    isoValue === isoFilter ||
    isoValue.startsWith(isoFilter) ||
    isoFilter.startsWith(isoValue) ||
    (!!dmValue && !!dmFilter && dmValue === dmFilter)
  )
}

/**
 * GET /api/resultados
 * 
 * Busca resultados diretamente do bichocerto.com usando parser HTML
 * 
 * Query params:
 * - date: Data no formato YYYY-MM-DD (opcional, padrão: hoje)
 * - location: Filtro por localização (opcional)
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const dateFilter = searchParams.get('date')
  const locationFilter = searchParams.get('location')
  const uf = resolveUF(locationFilter)

  // Determinar data a buscar (padrão: hoje)
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const dataBusca = dateFilter ? toIsoDate(dateFilter) : hoje.toISOString().split('T')[0]

  try {
    // Se não usar parser direto, tentar API antiga como fallback
    if (!USAR_BICHOCERTO_DIRETO) {
      console.log('⚠️ USAR_BICHOCERTO_DIRETO=false, usando API antiga')
      // TODO: Implementar fallback para API antiga se necessário
      throw new Error('API antiga desativada - use USAR_BICHOCERTO_DIRETO=true')
    }

    console.log(`🔍 Buscando resultados do bichocerto.com para data: ${dataBusca}`)

    // Buscar resultados de todas as loterias ativas
    const loteriasUnicas = Array.from(new Set(extracoes.filter(e => e.active).map(e => e.name)))
    
    const resultadosPorLoteria: Record<string, any[]> = {}
    const extracaoHorarios: Record<string, string[]> = {}

    // Buscar resultados de cada loteria em paralelo
    const promessas = loteriasUnicas.map(async (nomeLoteria) => {
      try {
        const resultadosBichoCerto = await buscarResultadosPorNome(nomeLoteria, dataBusca)
        
        if (resultadosBichoCerto.length > 0) {
          resultadosPorLoteria[nomeLoteria] = resultadosBichoCerto
          
          // Extrair horários encontrados
          if (!extracaoHorarios[nomeLoteria]) {
            extracaoHorarios[nomeLoteria] = []
          }
          resultadosBichoCerto.forEach(r => {
            if (!extracaoHorarios[nomeLoteria].includes(r.horario)) {
              extracaoHorarios[nomeLoteria].push(r.horario)
            }
          })
        }
      } catch (error) {
        console.error(`❌ Erro ao buscar resultados para ${nomeLoteria}:`, error)
      }
    })

    await Promise.all(promessas)

    // Converter resultados do parser para formato ResultadoItem
    let results: ResultadoItem[] = []

    Object.entries(resultadosPorLoteria).forEach(([nomeLoteria, resultadosBichoCerto]) => {
      resultadosBichoCerto.forEach((resultadoBichoCerto) => {
        resultadoBichoCerto.premios.forEach((premio) => {
          const estado = inferUfFromName(nomeLoteria)
          const locationResolved = UF_NAME_MAP[estado || ''] || nomeLoteria
          
          // Normalizar horário do resultado
          const horarioOriginal = resultadoBichoCerto.horario
          const horarioNormalizado = normalizarHorarioResultado(nomeLoteria, horarioOriginal)
          
          const resultadoItem: ResultadoItem = {
            position: premio.posicao,
            posicao: parseInt(premio.posicao.replace(/\D/g, ''), 10),
            milhar: premio.numero,
            grupo: premio.grupo,
            animal: premio.animal,
            drawTime: horarioNormalizado,
            horario: horarioNormalizado,
            horarioOriginal: horarioOriginal !== horarioNormalizado ? horarioOriginal : undefined,
            loteria: nomeLoteria,
            location: locationResolved,
            date: dataBusca,
            dataExtracao: dataBusca,
            estado,
            fonte: 'bichocerto.com',
          }
          
          results.push(resultadoItem)
        })
      })
    })

    // Filtro por data
    if (dateFilter) {
      results = results.filter((r) => matchesDateFilter(r.dataExtracao || r.date, dateFilter))
    }
    
    // Filtro por UF ou nome
    if (uf) {
      results = results.filter((r) => (r.estado || '').toUpperCase() === uf)
    } else if (locationFilter) {
      const lf = normalizeText(locationFilter)
      results = results.filter((r) => normalizeText(r.location || '').includes(lf))
    }

    // Logs de debug
    Object.entries(extracaoHorarios).forEach(([extracao, horarios]) => {
      console.log(`📊 Extração "${extracao}": ${horarios.length} horário(s) - ${horarios.join(', ')}`)
    })
    console.log(`📈 Total processado: ${Object.keys(extracaoHorarios).length} extrações, ${Object.values(extracaoHorarios).reduce((sum, h) => sum + h.length, 0)} horários, ${results.length} resultados`)

    // Agrupar e ordenar por loteria|horário|data, limitando a 7 posições por grupo
    const grouped: Record<string, ResultadoItem[]> = {}
    results.forEach((r) => {
      const key = `${r.loteria || ''}|${r.drawTime || ''}|${r.date || ''}`
      grouped[key] = grouped[key] || []
      grouped[key].push(r)
    })
    
    results = Object.values(grouped)
      .map((arr) => orderByPosition(arr).slice(0, 7))
      .flat()

    console.log(`✅ Resultados finais: ${Object.keys(grouped).length} grupos únicos (loteria|horário|data), ${results.length} resultados totais`)

    const payload: ResultadosResponse = {
      results,
      updatedAt: new Date().toISOString(),
    }

    return NextResponse.json(payload, { status: 200, headers: { 'Cache-Control': 'no-cache' } })
  } catch (error) {
    console.error('❌ Erro ao buscar resultados do bichocerto.com:', error)
    return NextResponse.json(
      {
        results: [],
        updatedAt: new Date().toISOString(),
        error: 'Falha ao buscar resultados do bichocerto.com',
      } satisfies ResultadosResponse & { error: string },
      { status: 502 }
    )
  }
}
