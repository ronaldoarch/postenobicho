import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/cotacoes/especiais
 * Busca cotações especiais ativas (isSpecial: true e active: true)
 * Usado na Home e na página de Cotações
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const modalidadeId = searchParams.get('modalidadeId')
    const extracaoId = searchParams.get('extracaoId')
    const limit = searchParams.get('limit')

    const where: any = {
      isSpecial: true,
      active: true,
    }

    if (modalidadeId) {
      where.modalidadeId = parseInt(modalidadeId)
    }

    if (extracaoId) {
      where.extracaoId = parseInt(extracaoId)
    }

    const cotacoes = await prisma.cotacao.findMany({
      where,
      include: {
        modalidade: {
          select: {
            id: true,
            name: true,
          },
        },
        extracao: {
          select: {
            id: true,
            name: true,
            time: true,
          },
        },
        promocao: {
          select: {
            id: true,
            titulo: true,
            tipo: true,
          },
        },
      },
      orderBy: [
        { createdAt: 'desc' },
      ],
      take: limit ? parseInt(limit) : undefined,
    })

    return NextResponse.json({ cotacoes, total: cotacoes.length })
  } catch (error) {
    console.error('Erro ao buscar cotações especiais:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar cotações especiais', cotacoes: [] },
      { status: 500 }
    )
  }
}
