const DEFAULT_BASE_URL = process.env.RECEBA_BASE_URL ?? 'https://sandbox.receba.online'

export interface RecebaClientOptions {
  baseUrl?: string
  apiKey?: string
}

export async function recebaRequest<T = any>(path: string, options: RecebaClientOptions = {}, init?: RequestInit): Promise<T> {
  const url = `${options.baseUrl ?? DEFAULT_BASE_URL}${path}`
  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${options.apiKey ?? process.env.RECEBA_API_KEY ?? ''}`,
      ...(init?.headers || {}),
    },
    cache: 'no-store',
  })

  if (!res.ok) {
    const errorBody = await res.text().catch(() => '')
    throw new Error(`Receba API error ${res.status}: ${errorBody}`)
  }

  return (await res.json()) as T
}

// Alias para compatibilidade
const request = recebaRequest

// Exemplos de endpoints básicos, ajustáveis conforme a documentação oficial
// Documentação: https://docs.receba.online/
export async function recebaListTransactions(options: RecebaClientOptions = {}) {
  return request('/api/v1/transactions', options)
}

export async function recebaCreatePix(options: RecebaClientOptions = {}, payload: any) {
  // Tentar diferentes endpoints comuns da API do Receba Online
  // Documentação: https://docs.receba.online/
  // Baseado na documentação, os endpoints podem variar
  const endpoints = [
    '/api/v1/cashin',      // Endpoint comum para depósitos
    '/api/v1/pix',         // Endpoint específico para PIX
    '/cashin',             // Sem prefixo de versão
    '/pix',                // Sem prefixo de versão
    '/api/cashin',         // Versão alternativa
    '/api/pix',            // Versão alternativa
  ]

  let lastError: Error | null = null

  for (const endpoint of endpoints) {
    try {
      console.log(`Tentando endpoint: ${endpoint}`)
      const result = await recebaRequest(endpoint, options, {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      console.log(`Sucesso no endpoint: ${endpoint}`)
      return result
    } catch (error: any) {
      lastError = error
      // Se não for 404, não tentar outros endpoints
      if (!error.message?.includes('404')) {
        throw error
      }
      // Continuar tentando outros endpoints se for 404
      console.log(`Endpoint ${endpoint} retornou 404, tentando próximo...`)
    }
  }

  // Se todos os endpoints falharam com 404
  throw new Error(
    `Nenhum endpoint válido encontrado. Último erro: ${lastError?.message}. ` +
    `Verifique a documentação: https://docs.receba.online/`
  )
}

export async function recebaWebhookPing(options: RecebaClientOptions = {}) {
  return request('/api/v1/status', options)
}
