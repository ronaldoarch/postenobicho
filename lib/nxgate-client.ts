const DEFAULT_BASE_URL = 'https://nxgate.com.br'

export interface NxgateClientOptions {
  baseUrl?: string
  apiKey?: string
}

// Forçar uso de IPv4 em vez de IPv6 para garantir que o IP autorizado seja usado
// Isso é necessário porque o servidor tem ambos IPv4 e IPv6, mas apenas IPv4 está autorizado no Nxgate
if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'test') {
  try {
    const dns = require('dns')
    // Node.js 17+ usa 'ipv4first', versões anteriores usam 'verbatim'
    if (dns.setDefaultResultOrder) {
      dns.setDefaultResultOrder('ipv4first')
    }
  } catch (e) {
    // Ignorar erro se dns não estiver disponível
  }
}

export async function nxgateRequest<T = any>(path: string, options: NxgateClientOptions = {}, init?: RequestInit): Promise<T> {
  const url = `${options.baseUrl ?? DEFAULT_BASE_URL}${path}`
  const apiKey = options.apiKey ?? process.env.NXGATE_API_KEY ?? ''
  
  console.log(`🔗 Nxgate Request: ${url}`)
  console.log(`🔑 API Key presente: ${apiKey ? 'SIM' : 'NÃO'}`)
  
  // Headers limpos - NÃO incluir headers do cliente que possam confundir o Nxgate
  // Remover headers como x-forwarded-for, x-real-ip, etc. que são do cliente
  const cleanHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    'accept': 'application/json',
  }
  
  // Adicionar headers customizados do init, mas filtrar headers do cliente
  if (init?.headers) {
    const initHeaders = init.headers as Record<string, string>
    const clientHeaders = ['x-forwarded-for', 'x-real-ip', 'x-forwarded-proto', 'x-forwarded-host', 'cf-connecting-ip', 'true-client-ip']
    
    for (const [key, value] of Object.entries(initHeaders)) {
      if (!clientHeaders.includes(key.toLowerCase())) {
        cleanHeaders[key] = value
      }
    }
  }

  try {
    const res = await fetch(url, {
      ...init,
      headers: cleanHeaders,
      cache: 'no-store',
    })

    const responseText = await res.text()
    console.log(`📥 Nxgate Response Status: ${res.status}`)
    console.log(`📥 Nxgate Response Body: ${responseText.substring(0, 500)}`)

    if (!res.ok) {
      let errorBody: any
      try {
        errorBody = JSON.parse(responseText)
      } catch {
        errorBody = responseText
      }
      
      const errorMessage = typeof errorBody === 'object' && errorBody.message
        ? errorBody.message
        : typeof errorBody === 'string'
        ? errorBody
        : `Erro ${res.status}`
      
      console.error(`❌ Nxgate API Error ${res.status}:`, errorMessage)
      throw new Error(`Nxgate API error ${res.status}: ${errorMessage}`)
    }

    try {
      return JSON.parse(responseText) as T
    } catch (parseError) {
      console.error('❌ Erro ao fazer parse da resposta JSON:', parseError)
      throw new Error(`Resposta inválida da API Nxgate: não é JSON válido`)
    }
  } catch (fetchError: any) {
    console.error('❌ Erro na requisição fetch:', fetchError)
    if (fetchError.message && fetchError.message.includes('Nxgate API error')) {
      throw fetchError // Re-throw erros da API
    }
    throw new Error(`Erro de conexão com Nxgate: ${fetchError.message || String(fetchError)}`)
  }
}

/**
 * Interface para gerar PIX (cash-in)
 */
export interface NxgateCreatePixPayload {
  nome_pagador: string
  documento_pagador: string // CPF formatado (000.000.000-00)
  valor: number | string // Float ou string formatada
  api_key: string
  webhook?: string
  split_users?: Array<{
    // Configuração de split (até 2 objetos)
    [key: string]: any
  }>
}

/**
 * Interface para saque PIX (cash-out)
 */
export interface NxgateSaquePixPayload {
  api_key: string
  valor: number | string // Float ou string formatada
  chave_pix: string
  tipo_chave: 'CPF' | 'CNPJ' | 'PHONE' | 'EMAIL' | 'RANDOM'
  webhook?: string
}

/**
 * Resposta da API ao gerar PIX
 */
export interface NxgatePixResponse {
  idTransaction?: string
  qr_code?: string
  qr_code_image?: string
  status?: string
  [key: string]: any
}

/**
 * Resposta da API ao solicitar saque
 */
export interface NxgateSaqueResponse {
  idTransaction?: string
  status?: string
  [key: string]: any
}

/**
 * Gera um PIX para depósito (cash-in)
 * POST /api/pix/gerar
 */
export async function nxgateCreatePix(options: NxgateClientOptions = {}, payload: NxgateCreatePixPayload): Promise<NxgatePixResponse> {
  return nxgateRequest<NxgatePixResponse>('/api/pix/gerar', options, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

/**
 * Solicita um saque PIX (cash-out)
 * POST /api/pix/sacar
 */
export async function nxgateSaquePix(options: NxgateClientOptions = {}, payload: NxgateSaquePixPayload): Promise<NxgateSaqueResponse> {
  return nxgateRequest<NxgateSaqueResponse>('/api/pix/sacar', options, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
