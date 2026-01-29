import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { WebhookTracker } from '@/lib/webhook-tracker'

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
    // Aceitar tanto idTransaction quanto transaction_id (formato da API Nxgate)
    const idTransaction = body.idTransaction 
      ? String(body.idTransaction) 
      : body.transaction_id 
      ? String(body.transaction_id)
      : undefined
    const documentoPagador = body.documento_pagador ? String(body.documento_pagador) : undefined

    console.log('=== WEBHOOK NXGATE ===')
    console.log('Status:', status)
    console.log('ID Transaction:', idTransaction)
    console.log('Documento Pagador:', documentoPagador)
    console.log('Body completo:', body)
    console.log('====================')

    if (!idTransaction) {
      console.error('Webhook sem idTransaction ou transaction_id')
      console.error('Body recebido:', JSON.stringify(body, null, 2))
      return NextResponse.json({ error: 'idTransaction ou transaction_id é obrigatório' }, { status: 400 })
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

      // Verificar se é primeiro depósito do usuário
      const depositosPagosUsuario = await prisma.transacao.count({
        where: {
          usuarioId: transacao.usuarioId,
          tipo: 'deposito',
          status: 'pago',
        },
      })

      // Verificar se é primeiro depósito com este CPF (validação de CPF único)
      let isPrimeiroDepositoCPF = true
      if (transacao.usuario.cpf) {
        // Contar depósitos pagos de qualquer usuário com o mesmo CPF
        const usuariosComMesmoCPF = await prisma.usuario.findMany({
          where: { cpf: transacao.usuario.cpf },
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
      const bonusMax = Number(process.env.BONUS_FIRST_DEPOSIT_MAX ?? 100)
      const bonusValue = (depositosPagosUsuario === 0 && isPrimeiroDepositoCPF)
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

    // Processar saque (cash-out) - AUTOMÁTICO
    if (status === 'saque-pago' || status === 'saque_pago') {
      // Buscar saque pendente pelo idTransaction ou internalreference
      const saque = await prisma.saque.findFirst({
        where: {
          OR: [
            { referenciaExterna: idTransaction },
            { referenciaExterna: body.internalreference },
          ],
          status: { in: ['pendente', 'aprovado'] }, // Aceitar pendente ou já aprovado
        },
        include: {
          usuario: true,
        },
      })

      if (!saque) {
        console.log(`Saque não encontrado: ${idTransaction}`)
        return NextResponse.json({ status: 'received', message: 'Saque não encontrado' }, { status: 200 })
      }

      // Verificar se é um pagamento PIX de gerente
      const pagamentoPix = await prisma.pagamentoPix.findFirst({
        where: {
          transactionId: idTransaction,
        },
      })

      // Atualizar saque e transação - APROVAÇÃO AUTOMÁTICA
      await prisma.$transaction(async (tx) => {
        await tx.saque.update({
          where: { id: saque.id },
          data: {
            status: 'saque-pago', // Atualizar para saque-pago quando confirmado pelo Nxgate
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

        // Se for pagamento PIX de gerente, atualizar status também
        if (pagamentoPix) {
          await tx.pagamentoPix.update({
            where: { id: pagamentoPix.id },
            data: {
              status: 'pago',
            },
          })
          console.log(`✅ Pagamento PIX de Gerente CONFIRMADO: ${idTransaction} - Valor: R$ ${pagamentoPix.valor}`)
        }
      })

      // Enviar webhook de saque aprovado
      WebhookTracker.saque(saque.usuarioId, saque.id, saque.valor, 'aprovado').catch(err => {
        console.error(`Erro ao enviar webhook de saque aprovado para saque ${saque.id}:`, err)
      })

      console.log(`✅ Saque APROVADO AUTOMATICAMENTE: ${idTransaction} - Valor: R$ ${saque.valor}`)

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

      // Verificar se é um pagamento PIX de gerente
      const pagamentoPix = await prisma.pagamentoPix.findFirst({
        where: {
          transactionId: idTransaction,
        },
      })

      // Reverter saldo do usuário (estornar) - apenas se não for pagamento de gerente
      await prisma.$transaction(async (tx) => {
        // Atualizar saque
        await tx.saque.update({
          where: { id: saque.id },
          data: {
            status: 'saque-falhou',
            motivo: 'Falha no processamento pelo gateway',
          },
        })

        // Se for pagamento PIX de gerente, atualizar status também
        if (pagamentoPix) {
          await tx.pagamentoPix.update({
            where: { id: pagamentoPix.id },
            data: {
              status: 'falhou',
            },
          })
          console.log(`❌ Pagamento PIX de Gerente FALHOU: ${idTransaction} - Valor: R$ ${pagamentoPix.valor}`)
          // Não estornar saldo de usuário para pagamentos de gerente (não há saldo de usuário específico)
        } else {
          // Apenas estornar saldo se for saque de usuário (não pagamento de gerente)
          await tx.usuario.update({
            where: { id: saque.usuarioId },
            data: {
              saldo: {
                increment: saque.valor,
              },
            },
          })
        }

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
