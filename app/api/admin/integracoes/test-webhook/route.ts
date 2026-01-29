import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parseSessionToken } from '@/lib/auth'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const session = cookies().get('lotbicho_session')?.value
    const payload = parseSessionToken(session)

    if (!payload) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const user = await prisma.usuario.findUnique({
      where: { id: payload.id },
      select: { admin: true },
    })

    if (!user || !user.admin) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const { webhookUrl } = await req.json()

    if (!webhookUrl) {
      return NextResponse.json({ error: 'URL do webhook é obrigatória' }, { status: 400 })
    }

    // Enviar evento de teste
    const testEvent = {
      event: 'test',
      timestamp: new Date().toISOString(),
      data: {
        message: 'Este é um evento de teste do webhook',
        platform: 'Poste no Bicho',
      },
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'PosteNoBicho-Webhook/1.0',
      },
      body: JSON.stringify(testEvent),
      signal: AbortSignal.timeout(10000), // 10 segundos de timeout
    })

    if (!response.ok) {
      return NextResponse.json(
        {
          error: `Webhook retornou status ${response.status}`,
          status: response.status,
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Webhook testado com sucesso',
      status: response.status,
    })
  } catch (error: any) {
    console.error('Erro ao testar webhook:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao testar webhook' },
      { status: 500 }
    )
  }
}
