import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { parseSessionToken } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = cookies().get('lotbicho_session')?.value
    
    // Se não há sessão, retornar null sem erro (evita 401 no console)
    if (!session) {
      return NextResponse.json({ user: null }, { status: 200 })
    }
    
    const payload = parseSessionToken(session)
    if (!payload) {
      // Token inválido ou expirado - retornar null sem erro
      return NextResponse.json({ user: null }, { status: 200 })
    }

    const user = await prisma.usuario.findUnique({
      where: { id: payload.id },
      select: {
        id: true,
        nome: true,
        email: true,
        telefone: true,
        saldo: true,
        bonus: true,
        bonusBloqueado: true,
        bonusSemanal: true,
        admin: true, // Incluir campo admin
      },
    })

    if (!user) {
      // Usuário não encontrado - retornar null sem erro
      return NextResponse.json({ user: null }, { status: 200 })
    }

    return NextResponse.json({ user }, { status: 200 })
  } catch (error) {
    console.error('Erro ao obter usuário logado:', error)
    // Em caso de erro, retornar null em vez de 500 para evitar erros no console
    return NextResponse.json({ user: null }, { status: 200 })
  }
}
