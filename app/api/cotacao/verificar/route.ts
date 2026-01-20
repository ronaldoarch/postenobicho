import { NextRequest, NextResponse } from 'next/server'
import { verificarMilharCotada, verificarCentenaCotada, extrairCentena } from '@/lib/cotacao'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tipo = searchParams.get('tipo') // 'milhar' ou 'centena'
    const numero = searchParams.get('numero')

    if (!tipo || !numero) {
      return NextResponse.json(
        { error: 'Parâmetros obrigatórios: tipo, numero' },
        { status: 400 }
      )
    }

    if (tipo === 'milhar') {
      const resultado = await verificarMilharCotada(numero)
      return NextResponse.json(resultado)
    } else if (tipo === 'centena') {
      const resultado = await verificarCentenaCotada(numero)
      return NextResponse.json(resultado)
    } else {
      return NextResponse.json(
        { error: 'Tipo deve ser "milhar" ou "centena"' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Erro ao verificar cotação:', error)
    return NextResponse.json(
      { error: 'Erro ao verificar cotação', cotada: false, cotacao: null },
      { status: 500 }
    )
  }
}
