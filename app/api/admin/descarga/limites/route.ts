import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { parseSessionToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/descarga/limites
 * Lista todos os limites de descarga
 */
export async function GET(request: NextRequest) {
  const session = cookies().get('lotbicho_session')?.value
  const user = parseSessionToken(session)

  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  // TODO: Verificar se usuário é admin

  try {
    const limites = await prisma.limiteDescarga.findMany({
      orderBy: [
        { modalidade: 'asc' },
        { premio: 'asc' },
      ],
    })

    return NextResponse.json({ limites })
  } catch (error) {
    console.error('Erro ao buscar limites:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar limites de descarga' },
      { status: 500 }
    )
  }
}
