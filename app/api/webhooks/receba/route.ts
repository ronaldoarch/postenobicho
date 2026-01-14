import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * Webhook para depósitos do gateway Receba.
 * Espera um payload com pelo menos:
 * {
 *   amount: number,
 *   status: 'paid' | ...,
 *   externalId?: string,
 *   userId?: number,
 *   email?: string
 * }
 *
 * Obs: ajuste os campos conforme o payload real do Receba e faça a validação de assinatura se houver.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const amount = Number(body.amount || 0)
    const status = String(body.status || '').toLowerCase()
    const externalId = body.externalId ? String(body.externalId) : undefined
    const userIdPayload = body.userId ? Number(body.userId) : undefined
    const emailPayload = body.email ? String(body.email).toLowerCase() : undefined

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Valor inválido' }, { status: 400 })
    }

    // Processa apenas depósitos pagos
    if (status !== 'paid' && status !== 'pago') {
      return NextResponse.json({ message: 'Ignorado: status não pago' }, { status: 200 })
    }

    // Localizar usuário
    let user = null
    if (userIdPayload) {
      user = await prisma.usuario.findUnique({ where: { id: userIdPayload } })
    }
    if (!user && emailPayload) {
      user = await prisma.usuario.findUnique({ where: { email: emailPayload } })
    }

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    // Verificar se já existe transação igual (idempotência simples)
    if (externalId) {
      const existing = await prisma.transacao.findFirst({
        where: { referenciaExterna: externalId, tipo: 'deposito' },
      })
      if (existing) {
        return NextResponse.json({ message: 'Transação já processada' }, { status: 200 })
      }
    }

    // Contar depósitos pagos anteriores (para bônus de primeiro depósito)
    const depositosPagos = await prisma.transacao.count({
      where: { usuarioId: user.id, tipo: 'deposito', status: 'pago' },
    })

    // Regras de bônus
    const bonusPercent = Number(process.env.BONUS_FIRST_DEPOSIT_PERCENT ?? 50)
    const bonusLimit = Number(process.env.BONUS_FIRST_DEPOSIT_LIMIT ?? 100)
    const rolloverMult = Number(process.env.BONUS_ROLLOVER_MULTIPLIER ?? 3)

    let bonusAplicado = 0
    if (depositosPagos === 0 && bonusPercent > 0) {
      const calc = (amount * bonusPercent) / 100
      bonusAplicado = Math.min(calc, bonusLimit)
    }

    await prisma.$transaction(async (tx) => {
      // Criar transação
      await tx.transacao.create({
        data: {
          usuarioId: user!.id,
          tipo: 'deposito',
          status: 'pago',
          valor: amount,
          bonusAplicado,
          referenciaExterna: externalId,
          descricao: 'Depósito via Receba',
        },
      })

      // Atualizar saldo e bônus/rollover
      await tx.usuario.update({
        where: { id: user!.id },
        data: {
          saldo: { increment: amount },
          bonusBloqueado: bonusAplicado > 0 ? { increment: bonusAplicado } : undefined,
          rolloverNecessario: bonusAplicado > 0 ? { increment: bonusAplicado * rolloverMult } : undefined,
        },
      })
    })

    return NextResponse.json({
      message: 'Depósito processado',
      bonusAplicado,
    })
  } catch (error) {
    console.error('Erro no webhook Receba:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
