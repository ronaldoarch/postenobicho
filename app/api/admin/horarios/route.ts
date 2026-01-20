import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { parseSessionToken } from '@/lib/auth'
import { getHorariosConfig, updateHorariosConfig } from '@/lib/horarios-store'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = cookies().get('lotbicho_session')?.value
  const user = parseSessionToken(session)

  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  try {
    const config = await getHorariosConfig()
    return NextResponse.json({ horarios: config })
  } catch (error) {
    console.error('Erro ao buscar configurações de horários:', error)
    return NextResponse.json({ error: 'Erro ao buscar configurações' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const session = cookies().get('lotbicho_session')?.value
  const user = parseSessionToken(session)

  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const updated = await updateHorariosConfig(body)
    return NextResponse.json({ horarios: updated, message: 'Configurações salvas com sucesso' })
  } catch (error) {
    console.error('Erro ao atualizar configurações de horários:', error)
    return NextResponse.json({ error: 'Erro ao salvar configurações' }, { status: 500 })
  }
}
