/**
 * Parser de Resultados do Bicho Certo
 * 
 * Busca resultados diretamente do site oficial bichocerto.com
 * através de parsing HTML.
 */

export interface BichoCertoPremio {
  posicao: string      // "7º"
  numero: string       // "0022" (sempre 4 dígitos)
  grupo: string        // "06"
  animal: string       // "Cabra"
}

export interface BichoCertoResultado {
  horario: string        // "16:30"
  titulo: string         // "Resultado PTV-RJ 16:30"
  premios: BichoCertoPremio[]
}

/**
 * Mapeamento de nomes de loterias para códigos do bichocerto.com
 */
const LOTERIA_CODIGO_MAP: Record<string, string> = {
  'NACIONAL': 'ln',
  'PT SP': 'sp',
  'PT SP (BAND)': 'sp',
  'PT BAHIA': 'ba',
  'LOTEP': 'pb',
  'BOA SORTE': 'bs',
  'LOTECE': 'lce',
  'LOOK': 'lk',
  'FEDERAL': 'fd',
  'PT RIO': 'rj',
  'PARA TODOS': 'ln', // Para Todos usa código nacional
}

/**
 * Converte nome da loteria para código do bichocerto.com
 */
function nomeParaCodigo(nomeLoteria: string): string | null {
  const nomeNormalizado = nomeLoteria.toUpperCase().trim()
  
  // Buscar match exato primeiro
  if (LOTERIA_CODIGO_MAP[nomeNormalizado]) {
    return LOTERIA_CODIGO_MAP[nomeNormalizado]
  }
  
  // Buscar match parcial
  for (const [nome, codigo] of Object.entries(LOTERIA_CODIGO_MAP)) {
    if (nomeNormalizado.includes(nome) || nome.includes(nomeNormalizado)) {
      return codigo
    }
  }
  
  // Fallbacks específicos
  if (nomeNormalizado.includes('RIO') || nomeNormalizado.includes('RJ')) {
    return 'rj'
  }
  if (nomeNormalizado.includes('SP') || nomeNormalizado.includes('BANDEIRANTES')) {
    return 'sp'
  }
  if (nomeNormalizado.includes('BAHIA') || nomeNormalizado.includes('BA')) {
    return 'ba'
  }
  if (nomeNormalizado.includes('PARAIBA') || nomeNormalizado.includes('PB') || nomeNormalizado.includes('LOTEP')) {
    return 'pb'
  }
  if (nomeNormalizado.includes('CEARA') || nomeNormalizado.includes('CE') || nomeNormalizado.includes('LOTECE')) {
    return 'lce'
  }
  if (nomeNormalizado.includes('GOIAS') || nomeNormalizado.includes('GO') || nomeNormalizado.includes('LOOK')) {
    return 'lk'
  }
  if (nomeNormalizado.includes('FEDERAL')) {
    return 'fd'
  }
  if (nomeNormalizado.includes('NACIONAL') || nomeNormalizado.includes('PARA TODOS')) {
    return 'ln'
  }
  
  return null
}

/**
 * Busca resultados do bichocerto.com para uma loteria e data específicas
 * 
 * @param codigoLoteria Código da loteria (ex: "rj", "sp", "ln")
 * @param data Data no formato YYYY-MM-DD (ex: "2026-01-17")
 * @returns Array de resultados encontrados
 */
export async function buscarResultadosBichoCerto(
  codigoLoteria: string,
  data: string
): Promise<BichoCertoResultado[]> {
  const url = 'https://bichocerto.com/resultados/base/resultado/'
  
  // Preparar dados do formulário
  const formData = new URLSearchParams()
  formData.append('l', codigoLoteria)
  formData.append('d', data)
  
  // Headers opcionais (cookie PHPSESSID para acesso histórico)
  const headers: HeadersInit = {
    'Content-Type': 'application/x-www-form-urlencoded',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  }
  
  if (process.env.BICHOCERTO_PHPSESSID) {
    headers['Cookie'] = `PHPSESSID=${process.env.BICHOCERTO_PHPSESSID}`
  }
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData.toString(),
      cache: 'no-store',
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const html = await response.text()
    
    if (!html || html.trim().length === 0) {
      console.warn(`⚠️ Resposta vazia do bichocerto.com para ${codigoLoteria} em ${data}`)
      return []
    }
    
    return parsearHTML(html, codigoLoteria)
  } catch (error) {
    console.error(`❌ Erro ao buscar resultados do bichocerto.com (${codigoLoteria}, ${data}):`, error)
    throw error
  }
}

/**
 * Busca resultados usando nome da loteria ao invés de código
 */
export async function buscarResultadosPorNome(
  nomeLoteria: string,
  data: string
): Promise<BichoCertoResultado[]> {
  const codigo = nomeParaCodigo(nomeLoteria)
  
  if (!codigo) {
    console.warn(`⚠️ Código não encontrado para loteria: ${nomeLoteria}`)
    return []
  }
  
  return buscarResultadosBichoCerto(codigo, data)
}

/**
 * Parseia o HTML retornado pelo bichocerto.com
 * 
 * @param html HTML retornado pelo endpoint
 * @param codigoLoteria Código da loteria (para logs)
 * @returns Array de resultados extraídos
 */
function parsearHTML(html: string, codigoLoteria: string): BichoCertoResultado[] {
  const resultados: BichoCertoResultado[] = []
  
  // 1. Limpeza do HTML - Remove JavaScript do início
  let htmlLimpo = html
  if (html.startsWith('jQuery') || html.startsWith('document')) {
    const jsEnd = html.indexOf('</script>')
    if (jsEnd > 0) {
      htmlLimpo = html.substring(jsEnd + 9)
      console.log(`🔍 HTML limpo: removido ${jsEnd + 9} caracteres de JavaScript do início`)
    }
  }
  
  // Verificar estrutura básica
  const temDivDisplay = /div_display_\d+/i.test(htmlLimpo)
  const temTable = /<table[^>]*id=["']table_\d+["']/i.test(htmlLimpo)
  
  console.log(`🔍 Estrutura HTML: tem div_display=${temDivDisplay}, tem table=${temTable}`)
  
  if (!temDivDisplay || !temTable) {
    console.warn(`⚠️ Estrutura HTML não reconhecida para ${codigoLoteria}`)
    return []
  }
  
  // 2. Identificar divs de resultados (padrão: div_display_XX)
  const divRegex = /<div[^>]*id=["']div_display_(\d+)["'][^>]*>/gi
  const divsEncontradas: number[] = []
  let match
  
  while ((match = divRegex.exec(htmlLimpo)) !== null) {
    const horarioId = parseInt(match[1], 10)
    if (!divsEncontradas.includes(horarioId)) {
      divsEncontradas.push(horarioId)
    }
  }
  
  console.log(`🔍 Encontradas ${divsEncontradas.length} divs com div_display_`)
  
  // 3. Extrair resultados de cada div
  for (const horarioId of divsEncontradas) {
    try {
      const resultado = extrairPremiosDaTabela(htmlLimpo, horarioId, codigoLoteria)
      if (resultado && resultado.premios.length > 0) {
        resultados.push(resultado)
        console.log(`📊 Div ${horarioId}: ${resultado.premios.length} prêmio(s) extraído(s)`)
      }
    } catch (error) {
      console.error(`❌ Erro ao processar div ${horarioId}:`, error)
    }
  }
  
  return resultados
}

/**
 * Extrai prêmios de uma tabela específica
 * 
 * @param html HTML completo
 * @param horarioId ID do horário (ex: 16 para div_display_16)
 * @param codigoLoteria Código da loteria (para logs)
 * @returns Resultado extraído ou null
 */
function extrairPremiosDaTabela(
  html: string,
  horarioId: number,
  codigoLoteria: string
): BichoCertoResultado | null {
  // Buscar título do resultado (dentro da div)
  const tituloRegex = new RegExp(
    `<div[^>]*id=["']div_display_${horarioId}["'][^>]*>([\\s\\S]*?)<h5[^>]*>([^<]+)</h5>`,
    'i'
  )
  const tituloMatch = html.match(tituloRegex)
  const titulo = tituloMatch ? tituloMatch[2].trim() : `Resultado ${codigoLoteria.toUpperCase()} ${horarioId}`
  
  // Extrair horário do título (formato: "16:30")
  const horarioMatch = titulo.match(/(\d{1,2}):(\d{2})/)
  const horario = horarioMatch ? `${horarioMatch[1].padStart(2, '0')}:${horarioMatch[2]}` : `${horarioId}:00`
  
  // Buscar tabela correspondente
  const tableRegex = new RegExp(
    `<table[^>]*id=["']table_${horarioId}["'][^>]*>([\\s\\S]*?)</table>`,
    'i'
  )
  const tableMatch = html.match(tableRegex)
  
  if (!tableMatch) {
    console.warn(`⚠️ Tabela table_${horarioId} não encontrada`)
    return null
  }
  
  const tableContent = tableMatch[1]
  
  // Extrair linhas da tabela (<tr>)
  const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi
  const premios: BichoCertoPremio[] = []
  const posicoesExtraidas = new Set<string>()
  
  let trMatch
  while ((trMatch = trRegex.exec(tableContent)) !== null) {
    const linha = trMatch[1]
    
    // Ignorar linhas com "SUPER 5"
    if (/super\s*5/i.test(linha)) {
      continue
    }
    
    // Extrair células (<td>)
    const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi
    const celulas: string[] = []
    let tdMatch
    
    while ((tdMatch = tdRegex.exec(linha)) !== null) {
      // Remover tags HTML e emojis, manter apenas texto e números
      const conteudo = tdMatch[1]
        .replace(/<[^>]+>/g, '') // Remove tags HTML
        .replace(/<a[^>]*>([\s\S]*?)<\/a>/gi, '$1') // Extrai conteúdo de links
        .trim()
      
      if (conteudo) {
        celulas.push(conteudo)
      }
    }
    
    if (celulas.length < 3) {
      continue // Linha inválida
    }
    
    // 1. Extrair posição (primeira coluna)
    let posicao: string | null = null
    const posicaoMatch = celulas[0].match(/(\d+)[º°oO]?/)
    if (posicaoMatch) {
      posicao = `${posicaoMatch[1]}º`
      
      // Evitar duplicatas
      if (posicoesExtraidas.has(posicao)) {
        continue
      }
      posicoesExtraidas.add(posicao)
    }
    
    if (!posicao) {
      continue // Sem posição válida
    }
    
    // 2. Extrair número (milhar de 4 dígitos)
    let numero: string | null = null
    
    // Buscar números de 4 dígitos primeiro
    for (const celula of celulas) {
      const numero4Digitos = celula.match(/\b(\d{4})\b/)
      if (numero4Digitos) {
        numero = numero4Digitos[1]
        break
      }
    }
    
    // Se não encontrou, buscar números de 3 dígitos (normalizar para 4)
    if (!numero) {
      for (const celula of celulas) {
        const numero3Digitos = celula.match(/\b(\d{3})\b/)
        if (numero3Digitos) {
          // Normalizar para 4 dígitos (adicionar zero à esquerda)
          numero = numero3Digitos[1].padStart(4, '0')
          break
        }
      }
    }
    
    if (!numero) {
      continue // Sem número válido
    }
    
    // 3. Extrair grupo (1-2 dígitos entre 1-25)
    let grupo: string | null = null
    
    for (const celula of celulas) {
      const grupoMatch = celula.match(/\b(\d{1,2})\b/)
      if (grupoMatch) {
        const grupoNum = parseInt(grupoMatch[1], 10)
        // Validar que é grupo válido (1-25) e não é parte do número
        if (grupoNum >= 1 && grupoNum <= 25 && grupoNum.toString() !== numero) {
          grupo = grupoNum.toString().padStart(2, '0')
          break
        }
      }
    }
    
    // 4. Extrair animal (texto não numérico da última coluna)
    let animal: string | null = null
    
    // Buscar na última coluna primeiro
    const ultimaColuna = celulas[celulas.length - 1]
    if (ultimaColuna && !/^\d+$/.test(ultimaColuna.trim())) {
      animal = ultimaColuna.trim()
    } else {
      // Buscar em outras colunas
      for (const celula of celulas) {
        if (!/^\d+$/.test(celula.trim()) && celula.trim().length > 0) {
          animal = celula.trim()
          break
        }
      }
    }
    
    if (!animal) {
      animal = '' // Animal pode estar ausente
    }
    
    // Adicionar prêmio extraído
    premios.push({
      posicao,
      numero,
      grupo: grupo || '',
      animal,
    })
    
    console.log(`🔍 ${posicao} PRÊMIO extraído: número="${numero}", grupo="${grupo || 'N/A'}", animal="${animal}"`)
  }
  
  if (premios.length === 0) {
    return null
  }
  
  // Log de posições extraídas
  const posicoesStr = premios.map(p => p.posicao).join(', ')
  console.log(`Posições extraídas: ${posicoesStr}`)
  
  return {
    horario,
    titulo,
    premios,
  }
}
