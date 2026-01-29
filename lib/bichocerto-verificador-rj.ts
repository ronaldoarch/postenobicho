/**
 * Sistema de Verificação de Resultados - Rio de Janeiro
 * 
 * Baseado no guia completo de integração do bichocerto.com
 * Focado inicialmente apenas em Rio de Janeiro (RJ)
 * 
 * Funcionalidades:
 * - Busca resultados do bichocerto.com
 * - Verifica apostas automaticamente
 * - Cache de resultados
 * - Rate limiting
 * - Tratamento robusto de erros
 */

import { buscarResultadosBichoCerto, buscarResultadosPorNome, type BichoCertoResultado, type BichoCertoPremio } from './bichocerto-parser'

export interface VerificacaoAposta {
  sucesso: boolean
  data: string
  loteria: string
  total_apostado: number
  total_acertos: number
  acertos: AcertoDetalhado[]
  erro?: string
}

export interface AcertoDetalhado {
  numero: string
  horario: string
  posicao: string
  animal: string
  grupo: string
  premio?: number // Valor do prêmio (opcional)
}

// Cache simples em memória (para produção, usar Redis ou similar)
const cacheResultados = new Map<string, { dados: BichoCertoResultado[], timestamp: number }>()
const CACHE_TTL = 60 * 60 * 1000 // 1 hora

// Rate limiting simples
const rateLimitMap = new Map<string, { count: number, resetTime: number }>()
const RATE_LIMIT_MAX = 60 // 60 requisições
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minuto

/**
 * Verifica rate limiting por IP ou chave
 */
function verificarRateLimit(chave: string): boolean {
  const agora = Date.now()
  const limite = rateLimitMap.get(chave)

  if (!limite || agora > limite.resetTime) {
    rateLimitMap.set(chave, { count: 1, resetTime: agora + RATE_LIMIT_WINDOW })
    return true
  }

  if (limite.count >= RATE_LIMIT_MAX) {
    return false
  }

  limite.count++
  return true
}

/**
 * Busca resultados com cache
 */
async function buscarResultadosComCache(
  codigoLoteria: string,
  data: string
): Promise<BichoCertoResultado[]> {
  const cacheKey = `${codigoLoteria}_${data}`
  const cached = cacheResultados.get(cacheKey)

  // Verificar cache
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log(`📦 Cache hit para ${codigoLoteria} em ${data}`)
    return cached.dados
  }

  // Buscar do servidor
  console.log(`🌐 Buscando resultados do bichocerto.com para ${codigoLoteria} em ${data}`)
  const resultados = await buscarResultadosBichoCerto(codigoLoteria, data)

  // Atualizar cache
  cacheResultados.set(cacheKey, {
    dados: resultados,
    timestamp: Date.now(),
  })

  return resultados
}

/**
 * Verifica se um número apostado foi sorteado
 * 
 * @param numerosApostados Array de números apostados (ex: ['2047', '2881', '2289'])
 * @param resultados Resultados do sorteio
 * @returns Array de acertos encontrados
 */
function verificarNumeros(
  numerosApostados: string[],
  resultados: BichoCertoResultado[]
): AcertoDetalhado[] {
  const acertos: AcertoDetalhado[] = []

  // Normalizar números apostados (garantir 4 dígitos)
  const numerosNormalizados = numerosApostados.map(num => {
    const numLimpo = num.replace(/\D/g, '')
    return numLimpo.padStart(4, '0')
  })

  // Verificar cada resultado
  for (const resultado of resultados) {
    for (const premio of resultado.premios) {
      // Verificar se o número apostado está nos resultados
      if (numerosNormalizados.includes(premio.numero)) {
        acertos.push({
          numero: premio.numero,
          horario: resultado.titulo || resultado.horario,
          posicao: premio.posicao,
          animal: premio.animal,
          grupo: premio.grupo,
        })
      }
    }
  }

  return acertos
}

/**
 * Verifica apostas do Rio de Janeiro
 * 
 * @param nomeLoteria Nome da loteria (ex: "PT RIO", "PTV-RJ")
 * @param data Data no formato YYYY-MM-DD
 * @param numerosApostados Array de números apostados
 * @returns Resultado da verificação
 */
export async function verificarApostaRJ(
  nomeLoteria: string,
  data: string,
  numerosApostados: string[]
): Promise<VerificacaoAposta> {
  try {
    // Validar dados de entrada
    if (!nomeLoteria || !data || !numerosApostados || numerosApostados.length === 0) {
      return {
        sucesso: false,
        data,
        loteria: nomeLoteria,
        total_apostado: numerosApostados?.length || 0,
        total_acertos: 0,
        acertos: [],
        erro: 'Dados inválidos: loteria, data e números são obrigatórios',
      }
    }

    // Validar formato de data
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) {
      return {
        sucesso: false,
        data,
        loteria: nomeLoteria,
        total_apostado: numerosApostados.length,
        total_acertos: 0,
        acertos: [],
        erro: 'Formato de data inválido. Use YYYY-MM-DD',
      }
    }

    // Verificar rate limiting
    const rateLimitKey = `verificar_${nomeLoteria}_${data}`
    if (!verificarRateLimit(rateLimitKey)) {
      return {
        sucesso: false,
        data,
        loteria: nomeLoteria,
        total_apostado: numerosApostados.length,
        total_acertos: 0,
        acertos: [],
        erro: 'Rate limit excedido. Aguarde alguns instantes.',
      }
    }

    // Garantir que é apenas Rio de Janeiro
    const nomeLoteriaUpper = nomeLoteria.toUpperCase()
    if (!nomeLoteriaUpper.includes('RIO') && !nomeLoteriaUpper.includes('RJ')) {
      return {
        sucesso: false,
        data,
        loteria: nomeLoteria,
        total_apostado: numerosApostados.length,
        total_acertos: 0,
        acertos: [],
        erro: 'Esta função é apenas para loterias do Rio de Janeiro (RJ)',
      }
    }

    // Buscar resultados (com cache)
    const codigoLoteria = 'rj' // Sempre RJ para esta função
    const resultados = await buscarResultadosComCache(codigoLoteria, data)

    if (resultados.length === 0) {
      return {
        sucesso: true,
        data,
        loteria: nomeLoteria,
        total_apostado: numerosApostados.length,
        total_acertos: 0,
        acertos: [],
        erro: 'Nenhum resultado encontrado para esta data',
      }
    }

    // Verificar números apostados
    const acertos = verificarNumeros(numerosApostados, resultados)

    return {
      sucesso: true,
      data,
      loteria: nomeLoteria,
      total_apostado: numerosApostados.length,
      total_acertos: acertos.length,
      acertos,
    }
  } catch (error) {
    console.error('❌ Erro ao verificar aposta RJ:', error)
    return {
      sucesso: false,
      data,
      loteria: nomeLoteria,
      total_apostado: numerosApostados?.length || 0,
      total_acertos: 0,
      acertos: [],
      erro: error instanceof Error ? error.message : 'Erro desconhecido ao verificar aposta',
    }
  }
}

/**
 * Busca resultados do Rio de Janeiro
 * 
 * @param data Data no formato YYYY-MM-DD
 * @returns Array de resultados encontrados
 */
export async function buscarResultadosRJ(data: string): Promise<BichoCertoResultado[]> {
  try {
    // Validar formato de data
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) {
      throw new Error('Formato de data inválido. Use YYYY-MM-DD')
    }

    // Buscar resultados com cache
    return await buscarResultadosComCache('rj', data)
  } catch (error) {
    console.error('❌ Erro ao buscar resultados RJ:', error)
    throw error
  }
}

/**
 * Limpa o cache de resultados
 */
export function limparCache(): void {
  cacheResultados.clear()
  console.log('🗑️ Cache limpo')
}

/**
 * Obtém estatísticas do cache
 */
export function obterEstatisticasCache(): { tamanho: number, chaves: string[] } {
  return {
    tamanho: cacheResultados.size,
    chaves: Array.from(cacheResultados.keys()),
  }
}
