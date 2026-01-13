import { NextResponse } from 'next/server'

export async function POST() {
  const res = NextResponse.json({ message: 'Logout realizado' })
  res.cookies.set('lotbicho_session', '', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
  return res
}
