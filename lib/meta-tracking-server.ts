import { prisma } from './prisma'

// Helper para rastrear eventos no servidor (Conversions API)
export async function trackMetaEventServer(
  eventName: string,
  params: Record<string, any>,
  userId?: number
) {
  try {
    // Buscar configurações do Meta Pixel
    const config = await prisma.configuracao.findFirst()
    
    if (!config?.metaPixelEnabled || !config?.metaPixelId || !config?.metaAccessToken) {
      return { success: false, reason: 'Meta Pixel não configurado' }
    }

    // Obter dados do usuário se disponível
    let userData: { email?: string | null; telefone?: string | null; nome?: string | null } | null = null
    
    if (userId) {
      const user = await prisma.usuario.findUnique({
        where: { id: userId },
        select: {
          email: true,
          telefone: true,
          nome: true,
        },
      })
      userData = user
    }

    // Enviar para Conversions API
    const crypto = await import('crypto')
    
    const eventData: any = {
      event_name: eventName,
      event_time: Math.floor(Date.now() / 1000),
      action_source: 'website',
      event_source_url: params.source_url || 'https://postenobicho.com',
    }

    // Adicionar dados do usuário (para matching)
    if (userData) {
      eventData.user_data = {}
      
      if (userData.email) {
        eventData.user_data.em = crypto
          .createHash('sha256')
          .update(userData.email.toLowerCase().trim())
          .digest('hex')
      }
      
      if (userData.telefone) {
        const phone = userData.telefone.replace(/\D/g, '')
        if (phone) {
          eventData.user_data.ph = crypto
            .createHash('sha256')
            .update(phone)
            .digest('hex')
        }
      }
      
      if (userData.nome) {
        eventData.user_data.fn = crypto
          .createHash('sha256')
          .update(userData.nome.toLowerCase().trim())
          .digest('hex')
      }
    }

    // Adicionar dados customizados
    if (params.value) {
      eventData.custom_data = {
        currency: params.currency || 'BRL',
        value: params.value,
      }
      
      if (params.content_name) {
        eventData.custom_data.content_name = params.content_name
      }
      
      if (params.content_ids) {
        eventData.custom_data.content_ids = params.content_ids
      }
      
      if (params.num_items) {
        eventData.custom_data.num_items = params.num_items
      }
    }

    // Enviar para Conversions API
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${config.metaPixelId}/events`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: [eventData],
          access_token: config.metaAccessToken,
        }),
      }
    )

    const result = await response.json()
    
    if (!response.ok) {
      console.error('Erro na Conversions API:', result)
      return { success: false, error: result }
    }

    return { success: true, events_received: result.events_received }
  } catch (error) {
    console.error('Erro ao rastrear evento Meta:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// Funções específicas para eventos comuns
export const MetaTrackingServer = {
  trackBet: async (userId: number, value: number, modality?: string) => {
    return trackMetaEventServer('BetPlaced', {
      content_name: `Aposta - ${modality || 'Jogo do Bicho'}`,
      value,
      currency: 'BRL',
    }, userId)
  },
  
  trackDeposit: async (userId: number, value: number, paymentMethod?: string) => {
    return trackMetaEventServer('Deposit', {
      content_name: 'Depósito Realizado',
      value,
      currency: 'BRL',
      payment_method: paymentMethod,
    }, userId)
  },
  
  trackWithdrawal: async (userId: number, value: number) => {
    return trackMetaEventServer('Withdrawal', {
      content_name: 'Saque Realizado',
      value,
      currency: 'BRL',
    }, userId)
  },
  
  trackRegistration: async (userId: number) => {
    return trackMetaEventServer('CompleteRegistration', {
      content_name: 'Cadastro Realizado',
      value: 0,
      currency: 'BRL',
    }, userId)
  },
}
