import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'pendente'

    const apostas = await prisma.aposta.findMany({
      where: {
        status: status === 'todas' ? undefined : status,
      },
      include: {
        usuario: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 1000, // Limitar a 1000 para performance
    })

    return NextResponse.json({ apostas })
  } catch (error) {
    console.error('Erro ao buscar apostas:', error)
    return NextResponse.json({ error: 'Erro ao buscar apostas' }, { status: 500 })
  }
}
