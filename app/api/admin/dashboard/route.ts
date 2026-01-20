import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parseSessionToken } from '@/lib/auth'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const session = cookies().get('lotbicho_session')?.value
  const user = parseSessionToken(session)

  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const dataInicio = searchParams.get('dataInicio')
    const dataFim = searchParams.get('dataFim')

    // Parsear datas (formato: YYYY-MM-DD)
    const inicio = dataInicio ? new Date(dataInicio + 'T00:00:00.000Z') : null
    const fim = dataFim ? new Date(dataFim + 'T23:59:59.999Z') : null

    // Construir filtro de data
    const buildDateFilter = (field: string) => {
      if (inicio && fim) {
        return { [field]: { gte: inicio, lte: fim } }
      } else if (inicio) {
        return { [field]: { gte: inicio } }
      } else if (fim) {
        return { [field]: { lte: fim } }
      }
      return {}
    }

    // Total de Usuários
    const totalUsuarios = await prisma.usuario.count({
      where: buildDateFilter('createdAt'),
    })

    const novosUsuarios = await prisma.usuario.count({
      where: inicio || fim
        ? buildDateFilter('createdAt')
        : {
            createdAt: {
              gte: new Date(new Date().setDate(new Date().getDate() - 30)), // Últimos 30 dias
            },
          },
    })

    // Total de Depósitos
    const depositos = await prisma.transacao.findMany({
      where: {
        tipo: 'deposito',
        status: 'aprovado',
        ...buildDateFilter('createdAt'),
      },
      select: {
        valor: true,
        createdAt: true,
      },
    })

    const totalDepositos = depositos.reduce((sum, d) => sum + Number(d.valor || 0), 0)
    const qtdDepositos = depositos.length

    // Total de Saques
    const saques = await prisma.saque.findMany({
      where: buildDateFilter('createdAt'),
      select: {
        valor: true,
        status: true,
        createdAt: true,
      },
    })

    const totalSaques = saques
      .filter((s) => s.status === 'aprovado' || s.status === 'processando')
      .reduce((sum, s) => sum + Number(s.valor || 0), 0)
    const qtdSaques = saques.filter((s) => s.status === 'aprovado' || s.status === 'processando').length

    // Total de Apostas
    const apostas = await prisma.aposta.findMany({
      where: buildDateFilter('createdAt'),
      select: {
        valor: true,
        status: true,
        createdAt: true,
      },
    })

    const totalApostas = apostas.reduce((sum, a) => sum + Number(a.valor || 0), 0)
    const qtdApostas = apostas.length

    // Prêmios Pagos (apostas ganhas/liquidadas)
    const apostasGanhas = apostas.filter((a) => a.status === 'ganhou' || a.status === 'liquidado')
    const premiosPagos = apostasGanhas.reduce((sum, a) => {
      // Buscar retorno previsto ou calcular
      return sum + Number(a.valor || 0) * 10 // Placeholder - precisa buscar do detalhes
    }, 0)

    // Calcular prêmios pagos corretamente
    const apostasComPremio = await prisma.aposta.findMany({
      where: {
        status: { in: ['ganhou', 'liquidado'] },
        ...buildDateFilter('updatedAt'),
      },
      select: {
        valor: true,
        retornoPrevisto: true,
        detalhes: true,
      },
    })

    const premiosPagosCorreto = apostasComPremio.reduce((sum, a) => {
      const premio = a.detalhes && typeof a.detalhes === 'object' && 'premioTotal' in a.detalhes
        ? Number((a.detalhes as any).premioTotal || 0)
        : Number(a.retornoPrevisto || 0)
      return sum + premio
    }, 0)

    // Receita Líquida = Depósitos - Saques - Prêmios Pagos
    const receitaLiquida = totalDepositos - totalSaques - premiosPagosCorreto

    // Detalhes adicionais
    const apostasPorStatus = {
      pendente: apostas.filter((a) => a.status === 'pendente').length,
      ganhou: apostas.filter((a) => a.status === 'ganhou').length,
      perdeu: apostas.filter((a) => a.status === 'perdeu').length,
      liquidado: apostas.filter((a) => a.status === 'liquidado').length,
    }

    const saquesPorStatus = {
      pendente: saques.filter((s) => s.status === 'pendente').length,
      aprovado: saques.filter((s) => s.status === 'aprovado').length,
      processando: saques.filter((s) => s.status === 'processando').length,
      rejeitado: saques.filter((s) => s.status === 'rejeitado').length,
    }

    return NextResponse.json({
      stats: {
        totalUsuarios,
        novosUsuarios,
        totalDepositos,
        qtdDepositos,
        totalSaques,
        qtdSaques,
        totalApostas,
        qtdApostas,
        premiosPagos: premiosPagosCorreto,
        receitaLiquida,
      },
      detalhes: {
        apostasPorStatus,
        saquesPorStatus,
      },
      periodo: {
        inicio: dataInicio || null,
        fim: dataFim || null,
      },
    })
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error)
    return NextResponse.json({ error: 'Erro ao buscar estatísticas' }, { status: 500 })
  }
}
