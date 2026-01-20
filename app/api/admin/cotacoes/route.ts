import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { parseSessionToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/cotacoes
 * Lista todas as cotações
 */
export async function GET(request: NextRequest) {
  const session = cookies().get('postenobicho_session')?.value
  const user = parseSessionToken(session)

  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const isSpecial = searchParams.get('isSpecial')
    const active = searchParams.get('active')
    const modalidadeId = searchParams.get('modalidadeId')
    const extracaoId = searchParams.get('extracaoId')

    const where: any = {}
    
    if (isSpecial !== null) {
      where.isSpecial = isSpecial === 'true'
    }
    
    if (active !== null) {
      where.active = active === 'true'
    }
    
    if (modalidadeId) {
      where.modalidadeId = parseInt(modalidadeId)
    }
    
    if (extracaoId) {
      where.extracaoId = parseInt(extracaoId)
    }

    const cotacoes = await prisma.cotacao.findMany({
      where,
      include: {
        modalidade: {
          select: {
            id: true,
            name: true,
          },
        },
        extracao: {
          select: {
            id: true,
            name: true,
            time: true,
          },
        },
        promocao: {
          select: {
            id: true,
            titulo: true,
            tipo: true,
          },
        },
      },
      orderBy: [
        { isSpecial: 'desc' },
        { createdAt: 'desc' },
      ],
    })

    return NextResponse.json({ cotacoes, total: cotacoes.length })
  } catch (error) {
    console.error('Erro ao buscar cotações:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar cotações' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/cotacoes
 * Cria uma nova cotação
 */
export async function POST(request: NextRequest) {
  const session = cookies().get('postenobicho_session')?.value
  const user = parseSessionToken(session)

  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const {
      name,
      value,
      modalidadeId,
      extracaoId,
      promocaoId,
      isSpecial,
      active,
    } = body

    // Validação básica
    if (!value) {
      return NextResponse.json(
        { error: 'Valor é obrigatório' },
        { status: 400 }
      )
    }

    // Validar formato do valor (ex: "1x R$ 7000.00")
    const valueRegex = /^1x\s+R\$\s*\d+(?:\.\d{2})?$/
    if (!valueRegex.test(value)) {
      return NextResponse.json(
        { error: 'Formato de valor inválido. Use: "1x R$ XXXX.XX"' },
        { status: 400 }
      )
    }

    const cotacao = await prisma.cotacao.create({
      data: {
        name: name || null,
        value,
        modalidadeId: modalidadeId ? parseInt(modalidadeId) : null,
        extracaoId: extracaoId ? parseInt(extracaoId) : null,
        promocaoId: promocaoId ? parseInt(promocaoId) : null,
        isSpecial: isSpecial === true || isSpecial === 'true',
        active: active !== undefined ? active : true,
      },
      include: {
        modalidade: {
          select: {
            id: true,
            name: true,
          },
        },
        extracao: {
          select: {
            id: true,
            name: true,
            time: true,
          },
        },
        promocao: {
          select: {
            id: true,
            titulo: true,
            tipo: true,
          },
        },
      },
    })

    return NextResponse.json({
      cotacao,
      message: 'Cotação criada com sucesso',
    })
  } catch (error) {
    console.error('Erro ao criar cotação:', error)
    return NextResponse.json(
      { error: 'Erro ao criar cotação' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/admin/cotacoes
 * Atualiza uma cotação existente
 */
export async function PUT(request: NextRequest) {
  const session = cookies().get('postenobicho_session')?.value
  const user = parseSessionToken(session)

  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const {
      id,
      name,
      value,
      modalidadeId,
      extracaoId,
      promocaoId,
      isSpecial,
      active,
    } = body

    if (!id) {
      return NextResponse.json(
        { error: 'ID é obrigatório' },
        { status: 400 }
      )
    }

    // Validar formato do valor se fornecido
    if (value) {
      const valueRegex = /^1x\s+R\$\s*\d+(?:\.\d{2})?$/
      if (!valueRegex.test(value)) {
        return NextResponse.json(
          { error: 'Formato de valor inválido. Use: "1x R$ XXXX.XX"' },
          { status: 400 }
        )
      }
    }

    const updateData: any = {}
    
    if (name !== undefined) updateData.name = name || null
    if (value !== undefined) updateData.value = value
    if (modalidadeId !== undefined) updateData.modalidadeId = modalidadeId ? parseInt(modalidadeId) : null
    if (extracaoId !== undefined) updateData.extracaoId = extracaoId ? parseInt(extracaoId) : null
    if (promocaoId !== undefined) updateData.promocaoId = promocaoId ? parseInt(promocaoId) : null
    if (isSpecial !== undefined) updateData.isSpecial = isSpecial === true || isSpecial === 'true'
    if (active !== undefined) updateData.active = active

    const cotacao = await prisma.cotacao.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        modalidade: {
          select: {
            id: true,
            name: true,
          },
        },
        extracao: {
          select: {
            id: true,
            name: true,
            time: true,
          },
        },
        promocao: {
          select: {
            id: true,
            titulo: true,
            tipo: true,
          },
        },
      },
    })

    return NextResponse.json({
      cotacao,
      message: 'Cotação atualizada com sucesso',
    })
  } catch (error) {
    console.error('Erro ao atualizar cotação:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar cotação' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/cotacoes?id={id}
 * Deleta uma cotação
 */
export async function DELETE(request: NextRequest) {
  const session = cookies().get('postenobicho_session')?.value
  const user = parseSessionToken(session)

  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'ID é obrigatório' },
        { status: 400 }
      )
    }

    await prisma.cotacao.delete({
      where: { id: parseInt(id) },
    })

    return NextResponse.json({ message: 'Cotação deletada com sucesso' })
  } catch (error) {
    console.error('Erro ao deletar cotação:', error)
    return NextResponse.json(
      { error: 'Erro ao deletar cotação' },
      { status: 500 }
    )
  }
}
