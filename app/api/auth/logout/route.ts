import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST() {
  console.log('🔓 Iniciando logout...')
  
  // Limpar cookie usando cookies() do Next.js
  try {
    const cookieStore = cookies()
    cookieStore.delete('lotbicho_session')
    console.log('✅ Cookie deletado via cookies()')
  } catch (error) {
    console.error('⚠️ Erro ao deletar cookie via cookies():', error)
  }
  
  const res = NextResponse.json({ message: 'Logout realizado com sucesso' })
  
  // Limpar cookie no response de múltiplas formas para garantir
  const cookieOptions = {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
    expires: new Date(0),
  }
  
  // Tentar deletar de várias formas
  res.cookies.delete('lotbicho_session')
  res.cookies.set('lotbicho_session', '', cookieOptions)
  res.cookies.set('lotbicho_session', 'deleted', { ...cookieOptions, maxAge: -1 })
  
  console.log('✅ Cookie limpo no response')
  
  return res
}
