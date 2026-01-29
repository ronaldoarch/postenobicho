import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { parseSessionToken, isAdmin } from './auth'

/**
 * Verifica se o usuário está autenticado e é admin
 * Retorna o userId se for admin, ou null se não for
 */
export async function requireAdmin(request: NextRequest): Promise<{ userId: number } | NextResponse> {
  const sessionCookie = cookies().get('lotbicho_session')?.value || cookies().get('postenobicho_session')?.value
  
  if (!sessionCookie) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const user = parseSessionToken(sessionCookie)
  
  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  // Verificar se é admin
  const userIsAdmin = await isAdmin(user.id)
  
  if (!userIsAdmin) {
    return NextResponse.json({ 
      error: 'Acesso negado. Apenas administradores podem acessar esta rota.',
      details: `Usuário ${user.email} não possui permissões de administrador.`
    }, { status: 403 })
  }

  return { userId: user.id }
}
