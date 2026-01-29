import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const adminCheck = await requireAdmin(request)
  if (adminCheck instanceof NextResponse) {
    return adminCheck
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
      return {} // Sem filtro quando não há datas
    }

    // Total de Usuários (sem filtro de data se não especificado)
    const totalUsuarios = await prisma.usuario.count({
      where: inicio || fim ? buildDateFilter('createdAt') : {},
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
    // Nota: Depósitos via Nxgate recebem status 'pago' quando confirmados, não 'aprovado'
    // Buscar TODOS os depósitos pagos/aprovados (sem filtro de data se não especificado)
    const dateFilter = buildDateFilter('createdAt')
    const depositos = await prisma.transacao.findMany({
      where: {
        tipo: 'deposito',
        status: { in: ['aprovado', 'pago', 'paid'] }, // Incluir todos os status de pagos
        ...(Object.keys(dateFilter).length > 0 ? dateFilter : {}),
      },
      select: {
        valor: true,
        createdAt: true,
        status: true,
      },
    })

    const totalDepositos = depositos.reduce((sum, d) => sum + Number(d.valor || 0), 0)
    const qtdDepositos = depositos.length

    // Total de Saques (apenas saques de usuários, excluindo pagamentos PIX de gerentes)
    // Nota: Saques via Nxgate recebem status 'saque-pago' quando confirmados
    const saques = await prisma.saque.findMany({
      where: inicio || fim ? buildDateFilter('createdAt') : {},
      select: {
        valor: true,
        status: true,
        createdAt: true,
        referenciaExterna: true, // Para filtrar pagamentos PIX de gerentes
      },
    })

    // Filtrar saques de usuários (excluir pagamentos PIX de gerentes que têm referenciaExterna começando com "PIX-GERENTE-")
    const saquesUsuarios = saques.filter((s) => 
      !s.referenciaExterna || !s.referenciaExterna.startsWith('PIX-GERENTE-')
    )

    // Contar saques aprovados/pagos (não incluir pendentes ou rejeitados)
    const totalSaques = saquesUsuarios
      .filter((s) => s.status === 'aprovado' || s.status === 'processando' || s.status === 'saque-pago')
      .reduce((sum, s) => sum + Number(s.valor || 0), 0)
    const qtdSaques = saquesUsuarios.filter((s) => s.status === 'aprovado' || s.status === 'processando' || s.status === 'saque-pago').length

    // Total de Apostas (sem filtro de data se não especificado)
    const apostas = await prisma.aposta.findMany({
      where: inicio || fim ? buildDateFilter('createdAt') : {},
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

    // Calcular prêmios pagos corretamente (sem filtro de data se não especificado)
    const apostasComPremio = await prisma.aposta.findMany({
      where: {
        status: { in: ['ganhou', 'liquidado'] },
        ...(inicio || fim ? buildDateFilter('updatedAt') : {}),
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

    // Pagamentos PIX de Gerentes (sem filtro de data se não especificado)
    const pagamentosPix = await prisma.pagamentoPix.findMany({
      where: inicio || fim ? buildDateFilter('createdAt') : {},
      select: {
        valor: true,
        createdAt: true,
      },
    })

    const totalPagamentosPix = pagamentosPix.reduce((sum, p) => sum + Number(p.valor || 0), 0)
    const qtdPagamentosPix = pagamentosPix.length

    // Receita Líquida = Depósitos - Saques de Usuários - Prêmios Pagos - Pagamentos PIX de Gerentes
    const receitaLiquida = totalDepositos - totalSaques - premiosPagosCorreto - totalPagamentosPix

    // Calcular GGR (Gross Gaming Revenue)
    // GGR = ((Total Apostado - Total Prêmios) / Total Apostado) * 100
    let ggr = 0
    let ggrPercentual = 0
    if (totalApostas > 0) {
      ggr = totalApostas - premiosPagosCorreto
      ggrPercentual = (ggr / totalApostas) * 100
    }

    // Detalhes adicionais
    const apostasPorStatus = {
      pendente: apostas.filter((a) => a.status === 'pendente').length,
      ganhou: apostas.filter((a) => a.status === 'ganhou').length,
      perdeu: apostas.filter((a) => a.status === 'perdeu').length,
      liquidado: apostas.filter((a) => a.status === 'liquidado').length,
    }

    const saquesPorStatus = {
      pendente: saquesUsuarios.filter((s) => s.status === 'pendente').length,
      aprovado: saquesUsuarios.filter((s) => s.status === 'aprovado' || s.status === 'saque-pago').length, // Incluir saque-pago como aprovado
      processando: saquesUsuarios.filter((s) => s.status === 'processando').length,
      rejeitado: saquesUsuarios.filter((s) => s.status === 'rejeitado' || s.status === 'saque-falhou').length, // Incluir saque-falhou como rejeitado
    }

    // Log para debug (remover em produção se necessário)
    console.log('📊 Dashboard Stats:', {
      totalUsuarios,
      totalDepositos,
      qtdDepositos,
      depositosEncontrados: depositos.length,
      totalApostas,
      qtdApostas,
      totalSaques,
      qtdSaques,
      periodo: { inicio: dataInicio || 'todos', fim: dataFim || 'todos' },
    })

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
        totalPagamentosPix,
        qtdPagamentosPix,
        ggr,
        ggrPercentual,
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
