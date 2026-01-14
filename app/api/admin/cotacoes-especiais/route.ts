import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { parseSessionToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/cotacoes-especiais
 * Lista todas as cotações especiais
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
    const tipo = searchParams.get('tipo') // 'milhar' ou 'centena'

    const where: any = {}
    if (tipo) {
      where.tipo = tipo
    }

    const cotacoes = await prisma.cotacaoEspecial.findMany({
      where,
      orderBy: [{ tipo: 'asc' }, { numero: 'asc' }],
    })

    return NextResponse.json({ cotacoes })
  } catch (error) {
    console.error('Erro ao buscar cotações especiais:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar cotações especiais' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/cotacoes-especiais
 * Cria uma nova cotação especial
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
    const { tipo, numero, ativo = true } = body

    if (!tipo || !numero) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: tipo, numero' },
        { status: 400 }
      )
    }

    if (tipo !== 'milhar' && tipo !== 'centena') {
      return NextResponse.json(
        { error: 'Tipo deve ser "milhar" ou "centena"' },
        { status: 400 }
      )
    }

    // Formatar número
    const numeroFormatado =
      tipo === 'milhar'
        ? numero.padStart(4, '0')
        : numero.padStart(3, '0')

    const cotacao = await prisma.cotacaoEspecial.create({
      data: {
        tipo,
        numero: numeroFormatado,
        ativo: Boolean(ativo),
      },
    })

    return NextResponse.json({
      message: 'Cotação especial criada com sucesso',
      cotacao,
    })
  } catch (error: any) {
    console.error('Erro ao criar cotação especial:', error)
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Esta cotação já existe' },
        { status: 409 }
      )
    }
    return NextResponse.json(
      { error: 'Erro ao criar cotação especial' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/cotacoes-especiais
 * Remove uma cotação especial
 */
export async function DELETE(request: NextRequest) {
  const session = cookies().get('lotbicho_session')?.value
  const user = parseSessionToken(session)

  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  // TODO: Verificar se usuário é admin

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 })
    }

    await prisma.cotacaoEspecial.delete({
      where: { id: Number(id) },
    })

    return NextResponse.json({ message: 'Cotação especial removida com sucesso' })
  } catch (error) {
    console.error('Erro ao remover cotação especial:', error)
    return NextResponse.json(
      { error: 'Erro ao remover cotação especial' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/admin/cotacoes-especiais
 * Atualiza uma cotação especial (ativa/inativa)
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
    const { id, ativo } = body

    if (!id || ativo === undefined) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: id, ativo' },
        { status: 400 }
      )
    }

    const cotacao = await prisma.cotacaoEspecial.update({
      where: { id: Number(id) },
      data: { ativo: Boolean(ativo) },
    })

    return NextResponse.json({
      message: 'Cotação especial atualizada com sucesso',
      cotacao,
    })
  } catch (error) {
    console.error('Erro ao atualizar cotação especial:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar cotação especial' },
      { status: 500 }
    )
  }
}
