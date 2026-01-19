const DEFAULT_BASE_URL = 'https://nxgate.com.br'

export interface NxgateClientOptions {
  baseUrl?: string
  apiKey?: string
}

export async function nxgateRequest<T = any>(path: string, options: NxgateClientOptions = {}, init?: RequestInit): Promise<T> {
  const url = `${options.baseUrl ?? DEFAULT_BASE_URL}${path}`
  const apiKey = options.apiKey ?? process.env.NXGATE_API_KEY ?? ''
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'accept': 'application/json',
    ...(init?.headers || {}),
  }

  const res = await fetch(url, {
    ...init,
    headers,
    cache: 'no-store',
  })

  if (!res.ok) {
    const errorBody = await res.text().catch(() => '')
    throw new Error(`Nxgate API error ${res.status}: ${errorBody}`)
  }

  return (await res.json()) as T
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
