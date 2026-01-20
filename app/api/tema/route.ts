import { NextResponse } from 'next/server'
import { getTemaAtivo } from '@/lib/temas-store'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const tema = await getTemaAtivo()
    return NextResponse.json({ tema })
  } catch (error) {
    console.error('Erro ao buscar tema ativo:', error)
    return NextResponse.json({ error: 'Erro ao buscar tema ativo' }, { status: 500 })
  }
}
