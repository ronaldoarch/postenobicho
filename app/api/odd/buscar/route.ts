import { NextRequest, NextResponse } from 'next/server'
import { buscarOdd } from '@/lib/bet-rules-engine'

export const dynamic = 'force-dynamic'

/**
 * GET /api/odd/buscar
 * Busca a odd (multiplicador) de uma modalidade
 * 
 * Query params:
 * - modalidade: Tipo da modalidade (GRUPO, MILHAR, etc.)
 * - pos_from: Posição inicial (1-7)
 * - pos_to: Posição final (1-7)
 * - modalidadeId: ID da modalidade (opcional)
 * - modalityName: Nome da modalidade (opcional)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const modalidade = searchParams.get('modalidade') as any
    const pos_from = parseInt(searchParams.get('pos_from') || '1')
    const pos_to = parseInt(searchParams.get('pos_to') || '5')
    const modalidadeId = searchParams.get('modalidadeId') ? parseInt(searchParams.get('modalidadeId')!) : undefined
    const modalityName = searchParams.get('modalityName') || undefined
    
    if (!modalidade) {
      return NextResponse.json(
        { error: 'Parâmetro modalidade é obrigatório' },
        { status: 400 }
      )
    }
    
    const odd = await buscarOdd(
      modalidade,
      pos_from,
      pos_to,
      modalidadeId,
      modalityName
    )
    
    return NextResponse.json({ odd })
  } catch (error) {
    console.error('Erro ao buscar odd:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar odd' },
      { status: 500 }
    )
  }
}
