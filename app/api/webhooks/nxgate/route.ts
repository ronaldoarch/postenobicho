import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * Webhook para receber notificações do Nxgate
 * 
 * Webhook de depósito (cash-in):
 * {"status":"paid","idTransaction":"123231x23231-xxx2"}
 * 
 * Webhook de saque (cash-out):
 * {"status":"saque-pago","idTransaction":"123231x23231-xxx2"}
 * ou
 * {"status":"saque-falhou","idTransaction":"123231x23231-xxx2"}
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const status = String(body.status || '').toLowerCase()
    const idTransaction = body.idTransaction ? String(body.idTransaction) : undefined
    const documentoPagador = body.documento_pagador ? String(body.documento_pagador) : undefined

    console.log('=== WEBHOOK NXGATE ===')
    console.log('Status:', status)
    console.log('ID Transaction:', idTransaction)
    console.log('Documento Pagador:', documentoPagador)
    console.log('Body completo:', body)
    console.log('====================')

    if (!idTransaction) {
      console.error('Webhook sem idTransaction')
      return NextResponse.json({ error: 'idTransaction é obrigatório' }, { status: 400 })
    }

    // Processar depósito (cash-in)
    if (status === 'paid' || status === 'pago') {
      // Buscar transação pendente pelo idTransaction
      const transacao = await prisma.transacao.findFirst({
        where: {
          referenciaExterna: idTransaction,
          tipo: 'deposito',
          status: 'pendente',
        },
        include: {
          usuario: true,
        },
      })

      if (!transacao) {
        console.log(`Transação não encontrada: ${idTransaction}`)
        // Retornar 200 mesmo se não encontrar, para evitar reenvios
        return NextResponse.json({ status: 'received', message: 'Transação não encontrada' }, { status: 200 })
      }

      // Verificar se já foi processada
      if (transacao.status === 'pago') {
        console.log(`Transação já processada: ${idTransaction}`)
        return NextResponse.json({ status: 'received', message: 'Transação já processada' }, { status: 200 })
      }

      // Contar depósitos pagos anteriores (para bônus de primeiro depósito)
      const depositosPagos = await prisma.transacao.count({
        where: {
          usuarioId: transacao.usuarioId,
          tipo: 'deposito',
          status: 'pago',
        },
      })

      // Regras de bônus
      const bonusPercent = Number(process.env.BONUS_FIRST_DEPOSIT_PERCENT ?? 50)
      const bonusMax = Number(process.env.BONUS_FIRST_DEPOSIT_MAX ?? 100)
      const bonusValue = depositosPagos === 0
        ? Math.min(transacao.valor * (bonusPercent / 100), bonusMax)
        : 0

      // Atualizar transação e crédito do usuário
      await prisma.$transaction(async (tx) => {
        // Atualizar transação
        await tx.transacao.update({
          where: { id: transacao.id },
          data: {
            status: 'pago',
            bonusAplicado: bonusValue,
          },
        })

        // Creditar saldo do usuário
        await tx.usuario.update({
          where: { id: transacao.usuarioId },
          data: {
            saldo: {
              increment: transacao.valor + bonusValue,
            },
            bonus: bonusValue > 0 ? { increment: bonusValue } : undefined,
            bonusBloqueado: bonusValue > 0 ? { increment: bonusValue } : undefined,
            rolloverNecessario: bonusValue > 0
              ? { increment: (transacao.valor + bonusValue) * 3 } // Rollover 3x
              : undefined,
          },
        })
      })

      console.log(`✅ Depósito processado: ${idTransaction} - Valor: R$ ${transacao.valor} - Bônus: R$ ${bonusValue}`)

      // Resposta obrigatória: JSON com status 200
      return NextResponse.json({ status: 'received' }, { status: 200 })
    }

    // Processar saque (cash-out)
    if (status === 'saque-pago' || status === 'saque_pago') {
      // Buscar saque pendente pelo idTransaction
      const saque = await prisma.saque.findFirst({
        where: {
          referenciaExterna: idTransaction,
          status: 'pendente',
        },
      })

      if (!saque) {
        console.log(`Saque não encontrado: ${idTransaction}`)
        return NextResponse.json({ status: 'received', message: 'Saque não encontrado' }, { status: 200 })
      }

      // Atualizar saque e transação
      await prisma.$transaction(async (tx) => {
        await tx.saque.update({
          where: { id: saque.id },
          data: {
            status: 'saque-pago',
          },
        })

        await tx.transacao.updateMany({
          where: {
            referenciaExterna: idTransaction,
            tipo: 'saque',
          },
          data: {
            status: 'pago',
          },
        })
      })

      console.log(`✅ Saque processado: ${idTransaction} - Valor: R$ ${saque.valor}`)

      return NextResponse.json({ status: 'received' }, { status: 200 })
    }

    // Processar falha de saque
    if (status === 'saque-falhou' || status === 'saque_falhou') {
      // Buscar saque pendente pelo idTransaction
      const saque = await prisma.saque.findFirst({
        where: {
          referenciaExterna: idTransaction,
          status: 'pendente',
        },
        include: {
          usuario: true,
        },
      })

      if (!saque) {
        console.log(`Saque não encontrado: ${idTransaction}`)
        return NextResponse.json({ status: 'received', message: 'Saque não encontrado' }, { status: 200 })
      }

      // Reverter saldo do usuário (estornar)
      await prisma.$transaction(async (tx) => {
        // Atualizar saque
        await tx.saque.update({
          where: { id: saque.id },
          data: {
            status: 'saque-falhou',
            motivo: 'Falha no processamento pelo gateway',
          },
        })

        // Estornar saldo do usuário
        await tx.usuario.update({
          where: { id: saque.usuarioId },
          data: {
            saldo: {
              increment: saque.valor,
            },
          },
        })

        // Atualizar transação
        await tx.transacao.updateMany({
          where: {
            referenciaExterna: idTransaction,
            tipo: 'saque',
          },
          data: {
            status: 'falhou',
          },
        })
      })

      console.log(`❌ Saque falhou: ${idTransaction} - Valor estornado: R$ ${saque.valor}`)

      return NextResponse.json({ status: 'received' }, { status: 200 })
    }

    // Status não reconhecido - retornar 200 para evitar reenvios
    console.log(`Status não reconhecido: ${status}`)
    return NextResponse.json({ status: 'received', message: 'Status não reconhecido' }, { status: 200 })
  } catch (error: any) {
    console.error('Erro ao processar webhook Nxgate:', error)
    // Sempre retornar 200 para evitar reenvios infinitos
    return NextResponse.json({ status: 'received', error: error.message }, { status: 200 })
  }
}
