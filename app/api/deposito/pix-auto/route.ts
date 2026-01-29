import { NextRequest, NextResponse } from 'next/server'
import { getActiveGatewayByType } from '@/lib/gateways-store'
import { gateboxCreatePix, type GateboxCreatePixPayload } from '@/lib/gatebox-client'
import { nxgateCreatePix, type NxgateCreatePixPayload } from '@/lib/nxgate-client'
import { cookies } from 'next/headers'
import { parseSessionToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { randomUUID } from 'crypto'

export const dynamic = 'force-dynamic'

/**
 * Endpoint genérico que escolhe automaticamente o gateway ativo para depósitos PIX
 * Prioridade: Gatebox > NXGate
 */
export async function POST(req: NextRequest) {
  try {
    const session = cookies().get('postenobicho_session')?.value || cookies().get('lotbicho_session')?.value
    const payload = parseSessionToken(session)

    if (!payload) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const user = await prisma.usuario.findUnique({
      where: { id: payload.id },
      select: { id: true, nome: true, email: true, telefone: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    const body = await req.json()
    const { valor: valorRaw, document } = body

    const valor = typeof valorRaw === 'string' 
      ? parseFloat(valorRaw.replace(',', '.')) 
      : Number(valorRaw)

    if (!valor || isNaN(valor) || valor <= 0) {
      return NextResponse.json({ error: 'Valor inválido' }, { status: 400 })
    }

    // Verificar qual gateway está ativo
    const gatebox = await getActiveGatewayByType('gatebox')
    const nxgate = await getActiveGatewayByType('nxgate')
    
    // Prioridade: Gatebox > NXGate
    if (gatebox) {
      try {
        // Usar Gatebox
        const { getActiveGatewayByType } = await import('@/lib/gateways-store')
        const gateway = await getActiveGatewayByType('gatebox')
        
        let username = gateway?.username || process.env.GATEBOX_USERNAME
        let password = gateway?.passwordHash || process.env.GATEBOX_PASSWORD
        
        if (!username || !password) {
          throw new Error('Credenciais do Gatebox não configuradas. Configure username e password no painel admin.')
        }
        
        const baseUrl = gateway?.baseUrl || 'https://api.gatebox.com.br'
        const externalId = `dep_${user.id}_${Date.now()}_${randomUUID().substring(0, 8)}`
        
        const pixPayload: GateboxCreatePixPayload = {
          externalId,
          amount: parseFloat(valor.toFixed(2)),
          expire: 3600,
          description: `Depósito PIX - ${user.nome}`,
        }
        
        if (document) {
          const documentClean = document.replace(/\D/g, '')
          if (documentClean.length === 11 || documentClean.length === 14) {
            pixPayload.document = documentClean
          }
        }
        
        if (user.nome) pixPayload.name = user.nome.trim()
        if (user.email) pixPayload.email = user.email.trim()
        if (user.telefone) {
          const phoneClean = user.telefone.replace(/\D/g, '')
          if (phoneClean.length >= 10) {
            pixPayload.phone = `+55${phoneClean}`
          }
        }
        
        const pixResponse = await gateboxCreatePix({ username, password, baseUrl }, pixPayload)
        
        // A resposta do Gatebox vem no formato { statusCode: 200, data: { ... } }
        const responseData = (pixResponse as any)?.data || pixResponse
        
        const transactionId = responseData?.identifier || responseData?.uuid || responseData?.transactionId || responseData?.idTransaction || externalId
        const qrCodeText = responseData?.key || responseData?.qrcode || responseData?.qrCode || responseData?.qrcodeText
        const qrCodeImage = responseData?.qrcodeBase64 || responseData?.qrCodeBase64 || responseData?.keyBase64
        
        if (!transactionId || !qrCodeText) {
          console.error('Resposta inválida do Gatebox:', JSON.stringify(pixResponse, null, 2))
          throw new Error('Resposta inválida do Gatebox: transactionId ou qrCode não encontrados')
        }
        
        await prisma.transacao.create({
          data: {
            usuarioId: user.id,
            tipo: 'deposito',
            status: 'pendente',
            valor,
            referenciaExterna: externalId,
            gatewayId: gateway?.id,
            descricao: `Depósito PIX via Gatebox - Aguardando pagamento`,
            updatedAt: new Date(),
          },
        })
        
        let finalQrCodeImage = null
        if (qrCodeImage) {
          finalQrCodeImage = qrCodeImage.startsWith('data:') ? qrCodeImage : `data:image/png;base64,${qrCodeImage}`
        }
        
        return NextResponse.json({
          qrCode: finalQrCodeImage || qrCodeText,
          qrCodeText,
          qrCodeImage: finalQrCodeImage,
          transactionId,
          externalId,
          valor,
          status: responseData?.status || (pixResponse as any)?.status || 'pendente',
          expiresAt: new Date(Date.now() + (responseData?.expire || responseData?.timeout || 3600) * 1000).toISOString(),
        })
      } catch (gateboxError: any) {
        console.error('Erro ao usar Gatebox:', gateboxError.message)
        // Se o erro for de credenciais não configuradas, retornar erro específico
        if (gateboxError.message.includes('Credenciais do Gatebox não configuradas')) {
          return NextResponse.json(
            { error: 'Gateway Gatebox está ativo mas não tem credenciais configuradas. Configure username e password no painel admin (Gateways > Editar Gatebox).' },
            { status: 400 }
          )
        }
        // Continuar para tentar NXGate apenas se não for erro de credenciais
      }
    }
    
    if (nxgate) {
      try {
        // Usar NXGate
        const { getActiveGatewayByType } = await import('@/lib/gateways-store')
        const gateway = await getActiveGatewayByType('nxgate')
        
        const apiKey = gateway?.apiKey || process.env.NXGATE_API_KEY
        const baseUrl = gateway?.baseUrl || 'https://nxgate.com.br'
        
        if (!apiKey) {
          throw new Error('API Key do NXGate não configurada')
        }
        
        if (!document) {
          return NextResponse.json({ error: 'CPF é obrigatório para realizar depósito' }, { status: 400 })
        }
        
        const documentClean = document.replace(/\D/g, '')
        if (documentClean.length !== 11) {
          return NextResponse.json({ error: 'CPF inválido' }, { status: 400 })
        }
        
        // Formatar CPF (000.000.000-00)
        const cpfFormatado = documentClean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
        
        const pixPayload: NxgateCreatePixPayload = {
          nome_pagador: user.nome.trim() || 'Cliente',
          documento_pagador: cpfFormatado,
          valor: parseFloat(valor.toFixed(2)),
          api_key: apiKey,
          webhook: gateway?.webhookUrl || process.env.NXGATE_WEBHOOK_URL || `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/webhooks/nxgate`,
        }
        
        const pixResponse = await nxgateCreatePix({ apiKey, baseUrl }, pixPayload)
        
        const transactionId = pixResponse?.transactionId || pixResponse?.id
        const qrCodeText = pixResponse?.paymentCode || pixResponse?.qrCode
        const qrCodeImage = pixResponse?.paymentCodeBase64 || pixResponse?.qrCodeBase64
        
        if (!transactionId || !qrCodeText) {
          throw new Error('Resposta inválida do NXGate')
        }
        
        await prisma.transacao.create({
          data: {
            usuarioId: user.id,
            tipo: 'deposito',
            status: 'pendente',
            valor,
            referenciaExterna: transactionId,
            gatewayId: gateway?.id,
            descricao: `Depósito PIX via NXGate - Aguardando pagamento`,
            updatedAt: new Date(),
          },
        })
        
        let finalQrCodeImage = null
        if (qrCodeImage) {
          finalQrCodeImage = qrCodeImage.startsWith('data:') ? qrCodeImage : `data:image/png;base64,${qrCodeImage}`
        }
        
        return NextResponse.json({
          qrCode: finalQrCodeImage || qrCodeText,
          qrCodeText,
          qrCodeImage: finalQrCodeImage,
          paymentCode: qrCodeText,
          paymentCodeBase64: qrCodeImage,
          transactionId,
          valor,
          status: pixResponse.status || 'pendente',
          expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        })
      } catch (nxgateError: any) {
        console.error('Erro ao usar NXGate:', nxgateError.message)
        return NextResponse.json(
          { error: `Erro na API: ${nxgateError.message}` },
          { status: 500 }
        )
      }
    }
    
    // Nenhum gateway ativo encontrado
    return NextResponse.json(
      { error: 'Nenhum gateway de pagamento ativo encontrado. Configure um gateway no painel admin.' },
      { status: 500 }
    )
  } catch (error: any) {
    console.error('Erro ao processar depósito PIX:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao processar depósito PIX' },
      { status: 500 }
    )
  }
}
