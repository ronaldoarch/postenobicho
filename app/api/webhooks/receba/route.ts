import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { MetaTrackingServer } from '@/lib/meta-tracking-server'
import { WebhookTracker } from '@/lib/webhook-tracker'

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

    // Verificar se é primeiro depósito do usuário
    const depositosPagosUsuario = await prisma.transacao.count({
      where: { usuarioId: user.id, tipo: 'deposito', status: 'pago' },
    })

    // Verificar se é primeiro depósito com este CPF (validação de CPF único)
    let isPrimeiroDepositoCPF = true
    if (user.cpf) {
      // Contar depósitos pagos de qualquer usuário com o mesmo CPF
      const usuariosComMesmoCPF = await prisma.usuario.findMany({
        where: { cpf: user.cpf },
        select: { id: true },
      })
      
      if (usuariosComMesmoCPF.length > 0) {
        const userIdsComMesmoCPF = usuariosComMesmoCPF.map(u => u.id)
        const depositosPagosCPF = await prisma.transacao.count({
          where: {
            usuarioId: { in: userIdsComMesmoCPF },
            tipo: 'deposito',
            status: 'pago',
          },
        })
        isPrimeiroDepositoCPF = depositosPagosCPF === 0
      }
    }

    // Regras de bônus - só aplica se for primeiro depósito do usuário E primeiro depósito com o CPF
    const bonusPercent = Number(process.env.BONUS_FIRST_DEPOSIT_PERCENT ?? 50)
    const bonusLimit = Number(process.env.BONUS_FIRST_DEPOSIT_LIMIT ?? 100)
    const rolloverMult = Number(process.env.BONUS_ROLLOVER_MULTIPLIER ?? 3)

    let bonusAplicado = 0
    if (depositosPagosUsuario === 0 && isPrimeiroDepositoCPF && bonusPercent > 0) {
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
          updatedAt: new Date(),
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

    // Rastrear depósito confirmado no Meta Pixel (Conversions API)
    MetaTrackingServer.trackDeposit(user!.id, amount, 'PIX').catch(err => {
      console.error('Erro ao rastrear depósito confirmado no Meta Pixel:', err)
    })

    // Enviar webhook de depósito/redepósito
    // Nota: depositosPagos já foi contado acima, então após criar a transação será depositosPagos + 1
    // Mas precisamos verificar antes de criar a transação
    const depositosAntes = await prisma.transacao.count({
      where: { usuarioId: user!.id, tipo: 'deposito', status: 'pago' },
    })
    const isRedeposito = depositosAntes > 0

    WebhookTracker.deposito(user!.id, amount, externalId || '', isRedeposito).catch(err => {
      console.error('Erro ao enviar webhook de depósito:', err)
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
