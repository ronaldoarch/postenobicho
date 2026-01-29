import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { parseSessionToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/transacoes
 * Retorna todas as transações do usuário autenticado
 */
export async function GET(req: NextRequest) {
  try {
    const session = cookies().get('postenobicho_session')?.value || cookies().get('lotbicho_session')?.value
    const payload = parseSessionToken(session)

    if (!payload) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const user = await prisma.usuario.findUnique({
      where: { id: payload.id },
      select: { id: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    // Buscar transações do usuário (depósitos e saques)
    const transacoes = await prisma.transacao.findMany({
      where: {
        usuarioId: user.id,
        tipo: {
          in: ['deposito', 'saque'],
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50, // Limitar a 50 transações mais recentes
    })

    return NextResponse.json({ transacoes })
  } catch (error: any) {
    console.error('Erro ao buscar transações:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar transações', details: error.message },
      { status: 500 }
    )
  }
}
