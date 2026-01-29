import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

// Função para obter dados do usuário para matching
async function getUserData(userId?: number) {
  if (!userId) return null
  
  try {
    const user = await prisma.usuario.findUnique({
      where: { id: userId },
      select: {
        email: true,
        telefone: true,
        nome: true,
      },
    })
    
    return user
  } catch (error) {
    console.error('Erro ao buscar dados do usuário:', error)
    return null
  }
}

// Função para enviar evento para Conversions API da Meta
async function sendToConversionsAPI(
  pixelId: string,
  accessToken: string,
  eventName: string,
  params: Record<string, any>,
  userData?: { email?: string | null; telefone?: string | null; nome?: string | null }
) {
  // Preparar dados do evento
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
      // Hash SHA256 do email (requerido pela Meta)
      const crypto = await import('crypto')
      eventData.user_data.em = crypto
        .createHash('sha256')
        .update(userData.email.toLowerCase().trim())
        .digest('hex')
    }
    
    if (userData.telefone) {
      // Remover caracteres não numéricos e hash
      const phone = userData.telefone.replace(/\D/g, '')
      if (phone) {
        const crypto = await import('crypto')
        eventData.user_data.ph = crypto
          .createHash('sha256')
          .update(phone)
          .digest('hex')
      }
    }
    
    if (userData.nome) {
      const crypto = await import('crypto')
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
  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${pixelId}/events`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: [eventData],
          access_token: accessToken,
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
    console.error('Erro ao enviar para Conversions API:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { eventName, params } = body

    if (!eventName) {
      return NextResponse.json({ error: 'eventName é obrigatório' }, { status: 400 })
    }

    // Buscar configurações do Meta Pixel
    const config = await prisma.configuracao.findFirst()
    
    if (!config?.metaPixelId || !config?.metaAccessToken) {
      return NextResponse.json(
        { error: 'Meta Pixel não configurado' },
        { status: 400 }
      )
    }

    // Obter dados do usuário se estiver logado
    const session = cookies().get('lotbicho_session')?.value
    let userId: number | undefined
    
    if (session) {
      try {
        const { parseSessionToken } = await import('@/lib/auth')
        const user = parseSessionToken(session)
        userId = user?.id
      } catch (error) {
        // Usuário não autenticado, continuar sem user data
      }
    }

    const userData = userId ? await getUserData(userId) : null

    // Enviar para Conversions API
    const result = await sendToConversionsAPI(
      config.metaPixelId,
      config.metaAccessToken,
      eventName,
      {
        ...params,
        source_url: request.headers.get('referer') || 'https://postenobicho.com',
      },
      userData || undefined
    )

    if (result.success) {
      return NextResponse.json({
        success: true,
        events_received: result.events_received,
      })
    } else {
      return NextResponse.json(
        { error: 'Erro ao enviar evento', details: result.error },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Erro no endpoint de conversão:', error)
    return NextResponse.json(
      { error: 'Erro ao processar evento' },
      { status: 500 }
    )
  }
}
