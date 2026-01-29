import { prisma } from './prisma'
import crypto from 'crypto'

interface WebhookEvent {
  event: string
  timestamp: string
  data: Record<string, any>
  signature?: string
}

/**
 * Envia um evento para o webhook configurado
 */
export async function sendWebhookEvent(
  event: string,
  data: Record<string, any>
): Promise<{ success: boolean; error?: string }> {
  try {
    const config = await prisma.configuracao.findFirst()

    if (!config?.webhookEnabled || !config?.webhookUrl) {
      return { success: false, error: 'Webhook não configurado' }
    }

    // Verificar se o evento está na lista de eventos habilitados
    let webhookEvents: string[] = []
    if (config.webhookEvents) {
      try {
        webhookEvents =
          typeof config.webhookEvents === 'string'
            ? JSON.parse(config.webhookEvents)
            : config.webhookEvents
      } catch {
        webhookEvents = []
      }
    }

    if (webhookEvents.length > 0 && !webhookEvents.includes(event)) {
      return { success: false, error: 'Evento não habilitado' }
    }

    const payload: WebhookEvent = {
      event,
      timestamp: new Date().toISOString(),
      data,
    }

    // Adicionar assinatura se secret estiver configurado
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'PosteNoBicho-Webhook/1.0',
    }

    if (config.webhookSecret) {
      const signature = crypto
        .createHmac('sha256', config.webhookSecret)
        .update(JSON.stringify(payload))
        .digest('hex')
      payload.signature = signature
      headers['X-Webhook-Signature'] = signature
    }

    // Enviar webhook (não aguardar resposta para não bloquear)
    fetch(config.webhookUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    })
      .then((response) => {
        if (!response.ok) {
          console.error(`Webhook retornou status ${response.status} para evento ${event}`)
        }
      })
      .catch((error) => {
        console.error(`Erro ao enviar webhook para evento ${event}:`, error)
      })

    return { success: true }
  } catch (error: any) {
    console.error('Erro ao enviar webhook:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Funções específicas para eventos comuns
 */
export const WebhookTracker = {
  cadastro: async (userId: number, userData: { nome: string; email: string; telefone?: string | null }) => {
    const user = await prisma.usuario.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nome: true,
        email: true,
        telefone: true,
        createdAt: true,
      },
    })

    if (!user) return { success: false, error: 'Usuário não encontrado' }

    return sendWebhookEvent('cadastro', {
      userId: user.id,
      nome: user.nome,
      email: user.email,
      telefone: user.telefone,
      dataCadastro: user.createdAt.toISOString(),
    })
  },

  deposito: async (
    userId: number,
    valor: number,
    transactionId: string,
    isRedeposito: boolean = false
  ) => {
    const user = await prisma.usuario.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        saldo: true,
      },
    })

    if (!user) return { success: false, error: 'Usuário não encontrado' }

    // Contar depósitos anteriores
    const depositosAnteriores = await prisma.transacao.count({
      where: {
        usuarioId: userId,
        tipo: 'deposito',
        status: 'pago',
      },
    })

    return sendWebhookEvent(isRedeposito ? 'redeposito' : 'deposito', {
      userId: user.id,
      email: user.email,
      valor,
      transactionId,
      depositosAnteriores,
      saldoAtual: user.saldo,
      isRedeposito,
    })
  },

  aposta: async (
    userId: number,
    apostaId: number,
    valor: number,
    modalidade: string,
    status: string = 'pendente'
  ) => {
    const user = await prisma.usuario.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
      },
    })

    if (!user) return { success: false, error: 'Usuário não encontrado' }

    return sendWebhookEvent('aposta', {
      userId: user.id,
      email: user.email,
      apostaId,
      valor,
      modalidade,
      status,
    })
  },

  apostaGanha: async (userId: number, apostaId: number, premio: number) => {
    const user = await prisma.usuario.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        saldo: true,
      },
    })

    if (!user) return { success: false, error: 'Usuário não encontrado' }

    return sendWebhookEvent('aposta_ganha', {
      userId: user.id,
      email: user.email,
      apostaId,
      premio,
      saldoAtual: user.saldo,
    })
  },

  saque: async (userId: number, saqueId: number, valor: number, status: string) => {
    const user = await prisma.usuario.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
      },
    })

    if (!user) return { success: false, error: 'Usuário não encontrado' }

    return sendWebhookEvent(status === 'aprovado' ? 'saque_aprovado' : 'saque', {
      userId: user.id,
      email: user.email,
      saqueId,
      valor,
      status,
    })
  },

  login: async (userId: number) => {
    const user = await prisma.usuario.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
      },
    })

    if (!user) return { success: false, error: 'Usuário não encontrado' }

    return sendWebhookEvent('login', {
      userId: user.id,
      email: user.email,
    })
  },
}
