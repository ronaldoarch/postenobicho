/**
 * Parser para API de Resultados do PosteNoBicho
 * 
 * Endpoint: http://api.postenobicho.com/resultados.php
 * 
 * Formato de requisição:
 * POST com JSON: { "data": "YYYY-MM-DD", "horario": "HH Horas" }
 * 
 * Formato de resposta esperado:
 * {
 *   "sucesso": true,
 *   "resultados": [
 *     {
 *       "loteria": "PT RIO",
 *       "dataConcurso": "2024-01-15",
 *       "horario": "18:20",
 *       "premios": [...]
 *     }
 *   ]
 * }
 */

export interface PosteNoBichoResultado {
  loteria: string
  dataConcurso: string
  horario: string
  premios: PosteNoBichoPremio[]
}

export interface PosteNoBichoPremio {
  posicao: number
  milhar: string
  grupo: string // Grupo vem como string da API (ex: "20")
  animal: string
}

export interface PosteNoBichoResponse {
  sucesso: boolean
  mensagem?: string
  resultados: PosteNoBichoResultado[]
}

/**
 * Converte dezena (00-99) para grupo (1-25)
 */
function dezenaParaGrupo(dezena: number): number {
  if (dezena === 0) return 25
  return Math.floor((dezena - 1) / 4) + 1
}

/**
 * Converte grupo para nome do animal
 */
function grupoParaAnimal(grupo: number): string {
  const animais = [
    'Avestruz', 'Águia', 'Burro', 'Borboleta', 'Cachorro',
    'Cabra', 'Carneiro', 'Camelo', 'Cobra', 'Coelho',
    'Cavalo', 'Elefante', 'Galo', 'Gato', 'Jacaré',
    'Leão', 'Macaco', 'Porco', 'Pavão', 'Peru',
    'Touro', 'Tigre', 'Urso', 'Veado', 'Vaca'
  ]
  return animais[grupo - 1] || 'Desconhecido'
}

/**
 * Busca resultados da API do PosteNoBicho
 */
export async function buscarResultadosPosteNoBicho(
  data: string, // YYYY-MM-DD
  horario: string // "09", "11", "14", "16", "18", "21" ou "18" para Federal
): Promise<PosteNoBichoResultado | null> {
  try {
    const API_URL = 'http://api.postenobicho.com/resultados.php'
    
    // A API espera horário apenas como número (ex: "09", "14")
    const horarioFormatado = horario.padStart(2, '0')
    
    const requestBody = {
      data: data,
      horario: horarioFormatado, // Formato: "09", "11", "14", etc. (sem "Horas")
    }
    
    console.log(`🔍 Buscando resultados na API PosteNoBicho:`, JSON.stringify(requestBody))
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      cache: 'no-store',
    })

    const responseText = await response.text()
    console.log(`📥 Resposta da API (status ${response.status}):`, responseText.substring(0, 500))

    if (!response.ok) {
      console.error(`❌ Erro HTTP ao buscar resultados: ${response.status} - ${responseText}`)
      return null
    }

    let dataResponse: any
    try {
      dataResponse = JSON.parse(responseText)
    } catch (parseError) {
      console.error(`❌ Erro ao fazer parse da resposta JSON:`, parseError)
      console.error(`📥 Resposta raw:`, responseText)
      return null
    }

    console.log(`📊 Resposta parseada:`, JSON.stringify(dataResponse, null, 2).substring(0, 1000))

    if (!dataResponse.sucesso || !dataResponse.resultados || dataResponse.resultados.length === 0) {
      console.log(`⚠️ Nenhum resultado encontrado para ${data} às ${horarioFormatado}. Mensagem: ${dataResponse.mensagem || 'N/A'}`)
      return null
    }

    // Processar todos os resultados retornados pela API (pode haver múltiplos)
    // Mas normalmente retorna apenas um resultado por horário
    if (!dataResponse.resultados || dataResponse.resultados.length === 0) {
      console.log(`⚠️ Array de resultados vazio para ${data} às ${horarioFormatado}`)
      return null
    }
    
    const resultadoRaw = dataResponse.resultados[0]
    
    // Converter horário da resposta (ex: "14 Horas" -> "14:00")
    // A resposta vem com "14 Horas", mas precisamos converter para "14:00"
    const horarioResposta = resultadoRaw.horario || `${horarioFormatado} Horas`
    const horarioFormatadoFinal = horarioResposta.replace(' Horas', ':00')
    
    console.log(`✅ Resultado encontrado: ${resultadoRaw.loteria} - ${horarioFormatadoFinal} - ${resultadoRaw.premios?.length || 0} prêmios`)
    
    // Converter para o formato esperado
    const resultado: PosteNoBichoResultado = {
      loteria: resultadoRaw.loteria || 'PT RIO',
      dataConcurso: resultadoRaw.dataConcurso || data,
      horario: horarioFormatadoFinal,
      premios: (resultadoRaw.premios || []).map((premio: any) => {
        // Usar dados diretamente do JSON sem cálculos ou padding
        const milharStr = (premio.milhar || '').toString().replace(/\D/g, '')
        
        return {
          posicao: premio.posicao || 0,
          milhar: milharStr, // Manter como vem da API (sem padding)
          grupo: premio.grupo ? premio.grupo.toString() : '',
          animal: premio.animal || '',
        }
      }),
    }

    return resultado
  } catch (error) {
    console.error(`❌ Erro ao buscar resultados do PosteNoBicho API:`, error)
    return null
  }
}

/**
 * Busca todos os resultados do Rio de Janeiro para uma data
 * Horários: 09, 11, 14, 16, 18, 21
 */
export async function buscarResultadosRJPosteNoBicho(
  data: string // YYYY-MM-DD
): Promise<PosteNoBichoResultado[]> {
  const horarios = ['09', '11', '14', '16', '18', '21']
  const resultados: PosteNoBichoResultado[] = []

  for (const horario of horarios) {
    try {
      const resultado = await buscarResultadosPosteNoBicho(data, horario)
      if (resultado) {
        // Garantir que a loteria está definida como PT RIO
        resultado.loteria = 'PT RIO'
        resultados.push(resultado)
      }
    } catch (error) {
      console.error(`❌ Erro ao buscar resultado para ${data} às ${horario}:`, error)
    }
  }

  return resultados
}

/**
 * Busca resultado da Federal para uma data
 * Horário: 18
 */
export async function buscarResultadoFederalPosteNoBicho(
  data: string // YYYY-MM-DD
): Promise<PosteNoBichoResultado | null> {
  return await buscarResultadosPosteNoBicho(data, '18')
}

/**
 * Converte resultado do PosteNoBicho para o formato interno do sistema
 */
export function converterResultadoParaFormatoInterno(
  resultado: PosteNoBichoResultado
): {
  loteria: string
  dataConcurso: string
  horario: string
  premios: Array<{
    posicao: number
    milhar: string
    dezena: string
    grupo: string
    animal: string
  }>
} {
  return {
    loteria: resultado.loteria,
    dataConcurso: resultado.dataConcurso,
    horario: resultado.horario,
    premios: resultado.premios.map(premio => {
      // Calcular dezena do milhar
      const milharNum = parseInt(premio.milhar, 10)
      const dezena = milharNum % 100
      const dezenaStr = dezena.toString().padStart(2, '0')
      
      return {
        posicao: premio.posicao,
        milhar: premio.milhar,
        dezena: dezenaStr,
        grupo: premio.grupo, // Já vem como string
        animal: premio.animal,
      }
    }),
  }
}
