import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { parseSessionToken } from '@/lib/auth'
import {
  definirLimiteDescarga,
  buscarAlertasDescarga,
  resolverAlertaDescarga,
  calcularTotalApostadoPorPremio,
} from '@/lib/descarga'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/descarga
 * Lista limites e alertas de descarga
 */
export async function GET(request: NextRequest) {
  const session = cookies().get('lotbicho_session')?.value
  const user = parseSessionToken(session)

  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  // TODO: Verificar se usuário é admin

  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    if (action === 'alertas') {
      const alertas = await buscarAlertasDescarga()
      return NextResponse.json({ alertas })
    }

    // Retornar limites e alertas
    const alertas = await buscarAlertasDescarga()
    return NextResponse.json({
      alertas,
      message: 'Use ?action=alertas para ver apenas alertas',
    })
  } catch (error) {
    console.error('Erro ao buscar descarga:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar informações de descarga' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/descarga
 * Define ou atualiza limite de descarga
 */
export async function POST(request: NextRequest) {
  const session = cookies().get('lotbicho_session')?.value
  const user = parseSessionToken(session)

  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  // TODO: Verificar se usuário é admin

  try {
    const body = await request.json()
    const { modalidade, premio, limite } = body

    if (!modalidade || !premio || limite === undefined) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: modalidade, premio, limite' },
        { status: 400 }
      )
    }

    const resultado = await definirLimiteDescarga({
      modalidade,
      premio: Number(premio),
      limite: Number(limite),
    })

    return NextResponse.json({
      message: 'Limite definido com sucesso',
      limite: resultado,
    })
  } catch (error) {
    console.error('Erro ao definir limite:', error)
    return NextResponse.json(
      { error: 'Erro ao definir limite de descarga' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/admin/descarga
 * Resolve um alerta de descarga
 */
export async function PATCH(request: NextRequest) {
  const session = cookies().get('lotbicho_session')?.value
  const user = parseSessionToken(session)

  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  // TODO: Verificar se usuário é admin

  try {
    const body = await request.json()
    const { id } = body

    if (!id) {
      return NextResponse.json({ error: 'ID do alerta é obrigatório' }, { status: 400 })
    }

    const resultado = await resolverAlertaDescarga(Number(id))

    return NextResponse.json({
      message: 'Alerta resolvido com sucesso',
      alerta: resultado,
    })
  } catch (error) {
    console.error('Erro ao resolver alerta:', error)
    return NextResponse.json(
      { error: 'Erro ao resolver alerta de descarga' },
      { status: 500 }
    )
  }
}
