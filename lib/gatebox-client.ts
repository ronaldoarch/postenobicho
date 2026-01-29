const DEFAULT_BASE_URL = 'https://api.gatebox.com.br'

export interface GateboxClientOptions {
  baseUrl?: string
  username?: string
  password?: string
  accessToken?: string
}

let cachedToken: { token: string; expiresAt: number } | null = null

/**
 * Autentica na API Gatebox e retorna o access token
 */
export async function gateboxAuthenticate(options: GateboxClientOptions = {}): Promise<string> {
  // Verificar se há token em cache válido
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.token
  }

  const baseUrl = options.baseUrl || DEFAULT_BASE_URL
  const username = options.username || process.env.GATEBOX_USERNAME || ''
  const password = options.password || process.env.GATEBOX_PASSWORD || ''

  if (!username || !password) {
    throw new Error('Gatebox: username e password são obrigatórios')
  }

  try {
    const response = await fetch(`${baseUrl}/v1/customers/auth/sign-in`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username,
        password,
      }),
      cache: 'no-store',
    })

    const responseText = await response.text()
    console.log(`🔐 Gatebox Auth Status: ${response.status}`)

    if (!response.ok) {
      console.error(`❌ Gatebox Auth Error: ${responseText}`)
      throw new Error(`Gatebox authentication error ${response.status}: ${responseText}`)
    }

    const data = JSON.parse(responseText)
    const accessToken = data.access_token

    if (!accessToken) {
      throw new Error('Gatebox: access_token não encontrado na resposta')
    }

    // Cache do token por 1 hora (assumindo que o token expira em 1 hora)
    cachedToken = {
      token: accessToken,
      expiresAt: Date.now() + 3600000, // 1 hora
    }

    return accessToken
  } catch (error: any) {
    console.error('❌ Erro na autenticação Gatebox:', error)
    throw new Error(`Erro de autenticação Gatebox: ${error.message || String(error)}`)
  }
}

/**
 * Faz uma requisição autenticada para a API Gatebox
 */
export async function gateboxRequest<T = any>(
  path: string,
  options: GateboxClientOptions = {},
  init?: RequestInit
): Promise<T> {
  const baseUrl = options.baseUrl || DEFAULT_BASE_URL
  const url = `${baseUrl}${path}`

  // Obter token de autenticação
  let token = options.accessToken
  if (!token) {
    token = await gateboxAuthenticate(options)
  }

  console.log(`🔗 Gatebox Request: ${url}`)

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...(init?.headers as HeadersInit),
  }

  try {
    const res = await fetch(url, {
      ...init,
      headers,
      cache: 'no-store',
    })

    const responseText = await res.text()
    console.log(`📥 Gatebox Response Status: ${res.status}`)
    console.log(`📥 Gatebox Response Body: ${responseText.substring(0, 500)}`)

    if (!res.ok) {
      let errorBody: any
      try {
        errorBody = JSON.parse(responseText)
      } catch {
        errorBody = responseText
      }

      const errorMessage =
        typeof errorBody === 'object' && errorBody.message
          ? errorBody.message
          : typeof errorBody === 'string'
          ? errorBody
          : `Erro ${res.status}`

      console.error(`❌ Gatebox API Error ${res.status}:`, errorMessage)
      throw new Error(`Gatebox API error ${res.status}: ${errorMessage}`)
    }

    try {
      return JSON.parse(responseText) as T
    } catch (parseError) {
      console.error('❌ Erro ao fazer parse da resposta JSON:', parseError)
      throw new Error(`Resposta inválida da API Gatebox: não é JSON válido`)
    }
  } catch (fetchError: any) {
    console.error('❌ Erro na requisição fetch:', fetchError)
    if (fetchError.message && fetchError.message.includes('Gatebox API error')) {
      throw fetchError // Re-throw erros da API
    }
    throw new Error(`Erro de conexão com Gatebox: ${fetchError.message || String(fetchError)}`)
  }
}

/**
 * Interface para criar PIX (cash-in)
 */
export interface GateboxCreatePixPayload {
  externalId: string // ID de conciliação único
  amount: number // Valor do depósito
  document?: string // CPF/CNPJ do pagador (opcional)
  name?: string // Nome completo do pagador (opcional)
  email?: string // E-mail do pagador (opcional)
  phone?: string // Telefone do pagador (opcional, formato: +5514987654321)
  identification?: string // Descrição a ser exibida no momento do pagamento (opcional)
  expire?: number // Tempo de expiração em segundos (padrão: 3600)
  description?: string // Descrição da transação (opcional)
}

/**
 * Interface para saque PIX (cash-out)
 */
export interface GateboxWithdrawPixPayload {
  externalId: string // ID de conciliação único
  key: string // Chave PIX do recebedor
  name: string // Nome completo do recebedor
  description?: string // Descrição da transação (opcional)
  amount: number // Valor do saque
  documentNumber?: string // CPF/CNPJ do recebedor (obrigatório apenas se validação de chave PIX estiver ativa)
}

/**
 * Resposta da API ao criar PIX
 */
export interface GateboxPixResponse {
  qrcode?: string
  qrcodeBase64?: string
  transactionId?: string
  externalId?: string
  amount?: number
  expire?: number
  [key: string]: any
}

/**
 * Resposta da API ao solicitar saque
 */
export interface GateboxWithdrawResponse {
  transactionId?: string
  externalId?: string
  endToEnd?: string
  status?: string
  [key: string]: any
}

/**
 * Resposta da consulta de status
 */
export interface GateboxStatusResponse {
  transactionId?: string
  externalId?: string
  endToEnd?: string
  status?: string
  amount?: number
  [key: string]: any
}

/**
 * Resposta da consulta de saldo
 */
export interface GateboxBalanceResponse {
  balance?: number
  availableBalance?: number
  [key: string]: any
}

/**
 * Cria um PIX para depósito (cash-in)
 * POST /v1/customers/pix/create-immediate-qrcode
 */
export async function gateboxCreatePix(
  options: GateboxClientOptions = {},
  payload: GateboxCreatePixPayload
): Promise<GateboxPixResponse> {
  return gateboxRequest<GateboxPixResponse>('/v1/customers/pix/create-immediate-qrcode', options, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

/**
 * Solicita um saque PIX (cash-out)
 * POST /v1/customers/pix/withdraw
 */
export async function gateboxWithdrawPix(
  options: GateboxClientOptions = {},
  payload: GateboxWithdrawPixPayload
): Promise<GateboxWithdrawResponse> {
  return gateboxRequest<GateboxWithdrawResponse>('/v1/customers/pix/withdraw', options, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

/**
 * Consulta status de uma transação PIX
 * GET /v1/customers/pix/status
 */
export async function gateboxGetStatus(
  options: GateboxClientOptions = {},
  params: {
    transactionId?: string
    externalId?: string
    endToEnd?: string
  }
): Promise<GateboxStatusResponse> {
  const queryParams = new URLSearchParams()
  if (params.transactionId) queryParams.append('transactionId', params.transactionId)
  if (params.externalId) queryParams.append('externalId', params.externalId)
  if (params.endToEnd) queryParams.append('endToEnd', params.endToEnd)

  const queryString = queryParams.toString()
  const path = `/v1/customers/pix/status${queryString ? `?${queryString}` : ''}`

  return gateboxRequest<GateboxStatusResponse>(path, options, {
    method: 'GET',
  })
}

/**
 * Consulta saldo da conta
 * POST /v1/customers/account/balance
 */
export async function gateboxGetBalance(
  options: GateboxClientOptions = {}
): Promise<GateboxBalanceResponse> {
  return gateboxRequest<GateboxBalanceResponse>('/v1/customers/account/balance', options, {
    method: 'POST',
  })
}

/**
 * Valida uma chave PIX
 * GET /v1/customers/pix/pix-search
 */
export async function gateboxValidatePixKey(
  options: GateboxClientOptions = {},
  dict: string
): Promise<any> {
  return gateboxRequest(`/v1/customers/pix/pix-search?dict=${encodeURIComponent(dict)}`, options, {
    method: 'GET',
  })
}
