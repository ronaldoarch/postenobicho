import { NextResponse } from 'next/server'
import { ApiResponse, Result } from '@/types/api'
import { SAMPLE_RESULTS } from '@/data/results'

export const dynamic = 'force-dynamic'

// Converte dados de resultado para o formato da API
function convertResultsToApiFormat() {
  const today = new Date().toISOString().split('T')[0]
  return SAMPLE_RESULTS.map((result, index) => ({
    id: `result-${index + 1}`,
    lotteryId: 'lottery-default',
    lotteryName: 'PONTO-NOITE 18h',
    date: today,
    drawTime: '18:00',
    numbers: [result.milhar],
    animals: [result.animal],
    position: result.position,
    grupo: result.grupo,
    milhar: result.milhar,
    animal: result.animal,
  })) as Result[]
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const location = searchParams.get('location')
    const drawTime = searchParams.get('drawTime')

    // Converte resultados para o formato da API
    let filteredResults = convertResultsToApiFormat()

    if (date) {
      filteredResults = filteredResults.filter((result) => result.date === date)
    }

    if (location) {
      filteredResults = filteredResults.filter((result) => result.lotteryName?.includes(location))
    }

    if (drawTime) {
      filteredResults = filteredResults.filter((result) => result.drawTime === drawTime)
    }

    const response: ApiResponse<Result[]> = {
      type: 'success',
      message: 'Resultados obtidos com sucesso.',
      data: filteredResults,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching results:', error)
    const response: ApiResponse<null> = {
      type: 'error',
      message: 'Erro ao buscar resultados',
    }
    return NextResponse.json(response, { status: 500 })
  }
}
