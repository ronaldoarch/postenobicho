// Serviços para chamadas de API no frontend

import { ApiResponse, Quotation, LotteriesByRegion, Result } from '@/types/api'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api'

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data as ApiResponse<T>
  } catch (error) {
    console.error(`Error fetching ${endpoint}:`, error)
    return {
      type: 'error',
      message: error instanceof Error ? error.message : 'Erro desconhecido',
    }
  }
}

export const api = {
  // Busca cotações ativas
  getQuotations: async (): Promise<ApiResponse<Quotation[]>> => {
    return fetchApi<Quotation[]>('/quotations/active')
  },

  // Busca loterias
  getLotteries: async (): Promise<ApiResponse<LotteriesByRegion>> => {
    return fetchApi<LotteriesByRegion>('/lottery')
  },

  // Busca resultados
  getResults: async (params?: {
    date?: string
    location?: string
    drawTime?: string
  }): Promise<ApiResponse<Result[]>> => {
    const queryParams = new URLSearchParams()
    if (params?.date) queryParams.append('date', params.date)
    if (params?.location) queryParams.append('location', params.location)
    if (params?.drawTime) queryParams.append('drawTime', params.drawTime)

    const endpoint = `/results${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    return fetchApi<Result[]>(endpoint)
  },
}
