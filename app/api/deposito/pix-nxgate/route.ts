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

    // Garantir que valor seja um número
    const valor = typeof valorRaw === 'string' 
      ? parseFloat(valorRaw.replace(',', '.')) 
      : Number(valorRaw)

    if (!valor || isNaN(valor) || valor <= 0) {
      console.error('❌ Valor inválido recebido:', valorRaw, typeof valorRaw)
      return NextResponse.json({ error: 'Valor inválido' }, { status: 400 })
    }

    console.log('💰 Valor processado:', valor, 'Tipo:', typeof valor)

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
    const valorFormatado = parseFloat(valor.toFixed(2))
    const pixPayload: NxgateCreatePixPayload = {
      nome_pagador: user.nome.trim() || 'Cliente',
      documento_pagador: cpfFormatado,
      valor: valorFormatado,
      api_key: apiKey,
      webhook: finalWebhookUrl,
    }
    
    // Validar campos obrigatórios
    if (!pixPayload.nome_pagador || !pixPayload.documento_pagador || !pixPayload.valor) {
      console.error('❌ Payload inválido:', {
        nome_pagador: pixPayload.nome_pagador,
        documento_pagador: pixPayload.documento_pagador ? 'presente' : 'missing',
        valor: pixPayload.valor,
      })
      return NextResponse.json(
        { error: 'Dados inválidos para gerar PIX' },
        { status: 400 }
      )
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
    let pixResponse: any
    try {
      pixResponse = await nxgateCreatePix({ apiKey, baseUrl }, pixPayload)
      console.log('✅ Resposta recebida do Nxgate:', JSON.stringify(pixResponse, null, 2))
    } catch (nxgateError: any) {
      console.error('❌ Erro ao chamar API Nxgate:', nxgateError)
      console.error('❌ Stack:', nxgateError.stack)
      console.error('❌ Mensagem:', nxgateError.message)
      
      // Se o erro já tem uma mensagem específica, usar ela
      if (nxgateError.message && nxgateError.message.includes('Nxgate API error')) {
        const statusMatch = nxgateError.message.match(/error (\d+):/)
        const statusCode = statusMatch ? parseInt(statusMatch[1]) : 500
        return NextResponse.json(
          { error: `Erro na API Nxgate: ${nxgateError.message}` },
          { status: statusCode }
        )
      }
      
      throw nxgateError // Re-throw para ser capturado pelo catch externo
    }

    const transactionId = pixResponse?.idTransaction || pixResponse?.id_transaction || pixResponse?.transaction_id
    // A API Nxgate retorna paymentCode (texto) e paymentCodeBase64 (base64)
    const qrCodeText = pixResponse?.qr_code || pixResponse?.qrCode || pixResponse?.qrcode || pixResponse?.paymentCode
    const qrCodeImage = pixResponse?.qr_code_image || pixResponse?.qrCodeImage || pixResponse?.qrcode_image || pixResponse?.paymentCodeBase64

    if (!transactionId) {
      console.error('❌ ID da transação não encontrado na resposta:', JSON.stringify(pixResponse, null, 2))
      return NextResponse.json(
        { 
          error: 'ID da transação não retornado pela API',
          debug: process.env.NODE_ENV === 'development' ? pixResponse : undefined
        },
        { status: 500 }
      )
    }

    if (!qrCodeText) {
      console.error('❌ QR code não encontrado na resposta:', JSON.stringify(pixResponse, null, 2))
      return NextResponse.json(
        { 
          error: 'QR code não retornado pela API',
          debug: process.env.NODE_ENV === 'development' ? pixResponse : undefined
        },
        { status: 500 }
      )
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
        updatedAt: new Date(),
      },
    })

    // Garantir que temos o código PIX
    const finalQrCodeText = qrCodeText || ''
    
    // Processar imagem base64 (adicionar prefixo se necessário)
    let finalQrCodeImage = null
    if (qrCodeImage) {
      // Se já tiver prefixo data URI, usar como está
      if (qrCodeImage.startsWith('data:')) {
        finalQrCodeImage = qrCodeImage
      } else {
        // Adicionar prefixo data URI
        finalQrCodeImage = `data:image/png;base64,${qrCodeImage}`
      }
    }
    
    console.log('✅ Retornando resposta:', {
      hasQrCodeText: !!finalQrCodeText,
      hasQrCodeImage: !!finalQrCodeImage,
      qrCodeTextLength: finalQrCodeText.length,
      transactionId,
    })

    return NextResponse.json({
      qrCode: finalQrCodeImage || finalQrCodeText, // Imagem base64 ou texto do QR code
      qrCodeText: finalQrCodeText, // Texto do QR code para copiar e colar
      qrCodeImage: finalQrCodeImage, // Imagem base64 com prefixo data URI
      paymentCode: finalQrCodeText, // Alias para compatibilidade
      paymentCodeBase64: qrCodeImage, // Base64 sem prefixo (para referência)
      transactionId,
      valor,
      status: pixResponse.status || 'pendente',
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutos
    })
  } catch (error: any) {
    console.error('❌ Erro ao criar pagamento PIX:', error)
    console.error('❌ Tipo do erro:', typeof error)
    console.error('❌ Stack:', error?.stack)
    console.error('❌ Mensagem:', error?.message)
    console.error('❌ Response:', error?.response)
    
    // Tratar erros específicos da API Nxgate
    const errorMessage = error?.message || String(error) || 'Erro desconhecido'
    
    // Erro 401 - Não autorizado
    if (errorMessage.includes('401') || errorMessage.includes('Unauthorized') || errorMessage.includes('não autorizado')) {
      return NextResponse.json(
        { error: 'Erro de autenticação. Verifique se a API key está configurada corretamente no painel admin.' },
        { status: 401 }
      )
    }
    
    // Erro 422 - Validação
    if (errorMessage.includes('422') || errorMessage.includes('validação') || errorMessage.includes('validation')) {
      return NextResponse.json(
        { error: 'Dados inválidos. Verifique os dados informados (CPF, valor) e tente novamente.' },
        { status: 422 }
      )
    }
    
    // Erro 400 - Bad Request
    if (errorMessage.includes('400') || errorMessage.includes('Bad Request')) {
      return NextResponse.json(
        { error: 'Requisição inválida. Verifique os dados e tente novamente.' },
        { status: 400 }
      )
    }
    
    // Erro de conexão/rede
    if (errorMessage.includes('fetch') || errorMessage.includes('network') || errorMessage.includes('ECONNREFUSED')) {
      return NextResponse.json(
        { error: 'Erro de conexão com o gateway. Tente novamente em alguns instantes.' },
        { status: 503 }
      )
    }
    
    // Erro genérico com mais detalhes em desenvolvimento
    return NextResponse.json(
      { 
        error: errorMessage || 'Erro ao criar pagamento PIX. Tente novamente ou entre em contato com o suporte.',
        ...(process.env.NODE_ENV === 'development' && {
          debug: {
            message: error?.message,
            stack: error?.stack,
            name: error?.name,
          }
        })
      },
      { status: 500 }
    )
  }
}
