import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { parseSessionToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { nxgateCreatePix, type NxgateCreatePixPayload } from '@/lib/nxgate-client'

export const dynamic = 'force-dynamic'

/**
 * Cria um pagamento PIX via Nxgate e retorna o QR code
 */
export async function POST(req: NextRequest) {
  try {
    const session = cookies().get('postenobicho_session')?.value
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

    const { valor, document } = await req.json()

    if (!valor || valor <= 0) {
      return NextResponse.json({ error: 'Valor inválido' }, { status: 400 })
    }

    // CPF é obrigatório pela API do Nxgate
    if (!document) {
      return NextResponse.json({ error: 'CPF é obrigatório para realizar depósito' }, { status: 400 })
    }

    // Buscar gateway Nxgate ativo do banco de dados
    const { getActiveGatewayByType } = await import('@/lib/gateways-store')
    const gateway = await getActiveGatewayByType('nxgate')
    
    // Fallback para variável de ambiente se não houver gateway configurado
    const apiKey = gateway?.apiKey || process.env.NXGATE_API_KEY
    const baseUrl = gateway?.baseUrl || 'https://nxgate.com.br'
    const webhookUrl = gateway?.webhookUrl || process.env.NXGATE_WEBHOOK_URL
    
    if (!apiKey) {
      console.error('Gateway Nxgate não configurado e NXGATE_API_KEY não encontrado')
      return NextResponse.json(
        { error: 'Gateway Nxgate não configurado. Configure no painel admin ou nas variáveis de ambiente.' },
        { status: 500 }
      )
    }

    // Validar CPF - deve ter 11 dígitos
    const documentClean = document.replace(/\D/g, '')
    if (documentClean.length !== 11) {
      return NextResponse.json(
        { error: 'CPF inválido. Digite um CPF válido com 11 dígitos.' },
        { status: 400 }
      )
    }

    // Formatar CPF (000.000.000-00)
    const cpfFormatado = documentClean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')

    // URL do webhook (usar do gateway, variável de ambiente ou construir automaticamente)
    const finalWebhookUrl = webhookUrl || process.env.NXGATE_WEBHOOK_URL || `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/webhooks/nxgate`

    // Payload conforme documentação do Nxgate
    const pixPayload: NxgateCreatePixPayload = {
      nome_pagador: user.nome.trim(),
      documento_pagador: cpfFormatado,
      valor: parseFloat(valor.toFixed(2)),
      api_key: apiKey,
      webhook: finalWebhookUrl,
    }

    console.log('=== DEBUG PIX NXGATE CASHIN ===')
    console.log('Gateway ID:', gateway?.id || 'N/A (variável de ambiente)')
    console.log('Base URL:', baseUrl)
    console.log('API Key:', apiKey ? `${apiKey.substring(0, 10)}...` : 'MISSING')
    console.log('Payload:', {
      nome_pagador: pixPayload.nome_pagador,
      documento_pagador: pixPayload.documento_pagador ? `${pixPayload.documento_pagador.substring(0, 3)}***` : 'missing',
      valor: pixPayload.valor,
      webhook: pixPayload.webhook,
    })
    console.log('========================')

    // Criar pagamento PIX via Nxgate
    const pixResponse = await nxgateCreatePix({ apiKey, baseUrl }, pixPayload)
    console.log('Resposta recebida:', pixResponse)

    const transactionId = pixResponse.idTransaction
    const qrCodeText = pixResponse.qr_code
    const qrCodeImage = pixResponse.qr_code_image // Base64 da imagem (se disponível)

    if (!transactionId) {
      console.error('Resposta do Nxgate:', pixResponse)
      return NextResponse.json({ error: 'ID da transação não retornado pela API' }, { status: 500 })
    }

    if (!qrCodeText) {
      console.error('Resposta do Nxgate:', pixResponse)
      return NextResponse.json({ error: 'QR code não retornado pela API' }, { status: 500 })
    }

    // Criar registro da transação pendente
    await prisma.transacao.create({
      data: {
        usuarioId: user.id,
        tipo: 'deposito',
        status: 'pendente',
        valor,
        referenciaExterna: transactionId,
        gatewayId: gateway?.id,
        descricao: `Depósito PIX via Nxgate - Aguardando pagamento`,
      },
    })

    return NextResponse.json({
      qrCode: qrCodeImage || qrCodeText, // Imagem base64 ou texto do QR code
      qrCodeText, // Texto do QR code para copiar e colar
      transactionId,
      valor,
      status: pixResponse.status || 'pendente',
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutos
    })
  } catch (error: any) {
    console.error('Erro ao criar pagamento PIX:', error)
    
    // Tratar erros específicos da API Nxgate
    const errorMessage = error.message || ''
    
    // Erro 401 - Não autorizado
    if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
      return NextResponse.json(
        { error: 'Erro de autenticação. Verifique se a API key está configurada corretamente.' },
        { status: 401 }
      )
    }
    
    // Erro 422 - Validação
    if (errorMessage.includes('422')) {
      return NextResponse.json(
        { error: 'Dados inválidos. Verifique os dados informados e tente novamente.' },
        { status: 422 }
      )
    }
    
    // Erro 400 - Bad Request
    if (errorMessage.includes('400')) {
      return NextResponse.json(
        { error: 'Requisição inválida. Verifique os dados e tente novamente.' },
        { status: 400 }
      )
    }
    
    // Erro genérico
    return NextResponse.json(
      { error: errorMessage || 'Erro ao criar pagamento PIX. Tente novamente ou entre em contato com o suporte.' },
      { status: 500 }
    )
  }
}
