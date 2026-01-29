import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET - Lista todos os saques
 */
export async function GET(request: NextRequest) {
  const adminCheck = await requireAdmin(request)
  if (adminCheck instanceof NextResponse) {
    return adminCheck
  }

  try {

    // Buscar saques do banco de dados
    const saques = await prisma.saque.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        Usuario: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
      },
    })

    // Formatar saques para o frontend
    const saquesFormatados = saques.map((saque) => ({
      id: saque.id,
      usuario: saque.Usuario.nome || saque.Usuario.email || `Usuário ${saque.Usuario.id}`,
      valor: Number(saque.valor),
      status: saque.status,
      data: saque.createdAt.toLocaleDateString('pt-BR'),
      chavePix: saque.chavePix,
      tipoChavePix: saque.tipoChavePix,
      referenciaExterna: saque.referenciaExterna,
    }))

    return NextResponse.json({ 
      saques: saquesFormatados, 
      total: saquesFormatados.length 
    })
  } catch (error: any) {
    console.error('Erro ao buscar saques:', error)
    return NextResponse.json({ error: 'Erro ao buscar saques' }, { status: 500 })
  }
}

/**
 * PUT - Atualiza status de um saque
 */
export async function PUT(request: NextRequest) {
  const adminCheck = await requireAdmin(request)
  if (adminCheck instanceof NextResponse) {
    return adminCheck
  }

  try {

    const body = await request.json()
    const { id, status } = body

    if (!id || !status) {
      return NextResponse.json({ error: 'ID e status são obrigatórios' }, { status: 400 })
    }

    // Validar status
    const statusValidos = ['pendente', 'aprovado', 'rejeitado', 'saque-pago', 'saque-falhou']
    if (!statusValidos.includes(status)) {
      return NextResponse.json({ error: 'Status inválido' }, { status: 400 })
    }

    // Buscar saque
    const saque = await prisma.saque.findUnique({
      where: { id: Number(id) },
      include: { Usuario: true },
    })

    if (!saque) {
      return NextResponse.json({ error: 'Saque não encontrado' }, { status: 404 })
    }

    // Atualizar saque
    const saqueAtualizado = await prisma.saque.update({
      where: { id: Number(id) },
      data: { status },
      include: {
        Usuario: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
      },
    })

    // Se foi rejeitado, estornar saldo
    if (status === 'rejeitado' && saque.status === 'pendente') {
      await prisma.usuario.update({
        where: { id: saque.usuarioId },
        data: {
          saldo: { increment: saque.valor },
        },
      })
    }

    return NextResponse.json({ 
      saque: {
        id: saqueAtualizado.id,
        usuario: saqueAtualizado.Usuario.nome || saqueAtualizado.Usuario.email || `Usuário ${saqueAtualizado.Usuario.id}`,
        valor: Number(saqueAtualizado.valor),
        status: saqueAtualizado.status,
        data: saqueAtualizado.createdAt.toLocaleDateString('pt-BR'),
      },
      message: 'Saque atualizado com sucesso' 
    })
  } catch (error: any) {
    console.error('Erro ao atualizar saque:', error)
    return NextResponse.json({ error: 'Erro ao atualizar saque' }, { status: 500 })
  }
}
