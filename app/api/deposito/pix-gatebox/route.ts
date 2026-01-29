import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { parseSessionToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { gateboxCreatePix, type GateboxCreatePixPayload } from '@/lib/gatebox-client'
import { randomUUID } from 'crypto'

export const dynamic = 'force-dynamic'

/**
 * Cria um pagamento PIX via Gatebox e retorna o QR code
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

    // Buscar gateway Gatebox ativo do banco de dados
    const { getActiveGatewayByType } = await import('@/lib/gateways-store')
    const gateway = await getActiveGatewayByType('gatebox')
    
    // Prioridade: gateway do banco > variáveis de ambiente
    let username = gateway?.username || process.env.GATEBOX_USERNAME
    let password = gateway?.passwordHash || process.env.GATEBOX_PASSWORD
    
    // Fallback: tentar extrair do apiKey como JSON (compatibilidade com configuração antiga)
    if (!username || !password) {
      if (gateway?.apiKey) {
        try {
          const gatewayConfig = JSON.parse(gateway.apiKey)
          username = gatewayConfig.username || username
          password = gatewayConfig.password || password
        } catch {
          // Se não for JSON, usar apiKey como username (fallback)
          username = gateway.apiKey || username
        }
      }
    }
    
    const baseUrl = gateway?.baseUrl || 'https://api.gatebox.com.br'
    const webhookUrl = gateway?.webhookUrl || process.env.GATEBOX_WEBHOOK_URL
    
    if (!username || !password) {
      console.error('❌ Gateway Gatebox não configurado:', {
        hasGateway: !!gateway,
        hasUsername: !!username,
        hasPassword: !!password,
        gatewayId: gateway?.id,
      })
      return NextResponse.json(
        { error: 'Gateway Gatebox não configurado. Configure username e password no painel admin ou nas variáveis de ambiente GATEBOX_USERNAME e GATEBOX_PASSWORD.' },
        { status: 500 }
      )
    }
    
    console.log('✅ Gateway Gatebox configurado:', {
      gatewayId: gateway?.id,
      baseUrl,
      hasUsername: !!username,
      hasPassword: !!password,
    })

    // Validar CPF se fornecido (opcional na Gatebox, mas recomendado)
    let documentClean = ''
    if (document) {
      documentClean = document.replace(/\D/g, '')
      if (documentClean.length !== 11 && documentClean.length !== 14) {
        return NextResponse.json(
          { error: 'CPF/CNPJ inválido. Digite um CPF válido com 11 dígitos ou CNPJ com 14 dígitos.' },
          { status: 400 }
        )
      }
    }

    // Gerar externalId único para conciliação
    const externalId = `dep_${user.id}_${Date.now()}_${randomUUID().substring(0, 8)}`

    // URL do webhook (usar do gateway, variável de ambiente ou construir automaticamente)
    const finalWebhookUrl = webhookUrl || process.env.GATEBOX_WEBHOOK_URL || `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/webhooks/gatebox`

    // Payload conforme documentação do Gatebox
    const valorFormatado = parseFloat(valor.toFixed(2))
    const pixPayload: GateboxCreatePixPayload = {
      externalId,
      amount: valorFormatado,
      expire: 3600, // 1 hora em segundos
      description: `Depósito PIX - ${user.nome}`,
    }

    // Adicionar dados opcionais se disponíveis
    if (documentClean) {
      pixPayload.document = documentClean
    }
    if (user.nome) {
      pixPayload.name = user.nome.trim()
    }
    if (user.email) {
      pixPayload.email = user.email.trim()
    }
    if (user.telefone) {
      // Formatar telefone para formato internacional (+5514987654321)
      const phoneClean = user.telefone.replace(/\D/g, '')
      if (phoneClean.length >= 10) {
        pixPayload.phone = `+55${phoneClean}`
      }
    }
    pixPayload.identification = `Depósito de ${user.nome || 'Cliente'}`

    console.log('=== DEBUG PIX GATEBOX CASHIN ===')
    console.log('Gateway ID:', gateway?.id || 'N/A (variável de ambiente)')
    console.log('Base URL:', baseUrl)
    console.log('Username:', username ? `${username.substring(0, 5)}...` : 'MISSING')
    console.log('Payload:', {
      externalId: pixPayload.externalId,
      amount: pixPayload.amount,
      document: pixPayload.document ? `${pixPayload.document.substring(0, 3)}***` : 'missing',
      name: pixPayload.name,
    })
    console.log('========================')

    // Criar pagamento PIX via Gatebox
    let pixResponse: any
    try {
      pixResponse = await gateboxCreatePix({ username, password, baseUrl }, pixPayload)
      console.log('✅ Resposta recebida do Gatebox:', JSON.stringify(pixResponse, null, 2))
    } catch (gateboxError: any) {
      console.error('❌ Erro ao chamar API Gatebox:', gateboxError)
      console.error('❌ Stack:', gateboxError.stack)
      console.error('❌ Mensagem:', gateboxError.message)
      
      // Se o erro já tem uma mensagem específica, usar ela
      if (gateboxError.message && gateboxError.message.includes('Gatebox API error')) {
        const statusMatch = gateboxError.message.match(/error (\d+):/)
        const statusCode = statusMatch ? parseInt(statusMatch[1]) : 500
        return NextResponse.json(
          { error: `Erro na API Gatebox: ${gateboxError.message}` },
          { status: statusCode }
        )
      }
      
      throw gateboxError // Re-throw para ser capturado pelo catch externo
    }

    const transactionId = pixResponse?.transactionId || pixResponse?.idTransaction || pixResponse?.id_transaction || externalId
    const qrCodeText = pixResponse?.qrcode || pixResponse?.qrCode || pixResponse?.qrcodeText
    const qrCodeImage = pixResponse?.qrcodeBase64 || pixResponse?.qrCodeBase64 || pixResponse?.qrcode_image

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

    if (!qrCodeText && !qrCodeImage) {
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
    // Usar externalId como referenciaExterna para conciliação
    await prisma.transacao.create({
      data: {
        usuarioId: user.id,
        tipo: 'deposito',
        status: 'pendente',
        valor,
        referenciaExterna: externalId, // Usar externalId para conciliação com Gatebox
        gatewayId: gateway?.id,
        descricao: `Depósito PIX via Gatebox - Aguardando pagamento`,
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
      externalId,
    })

    return NextResponse.json({
      qrCode: finalQrCodeImage || finalQrCodeText, // Imagem base64 ou texto do QR code
      qrCodeText: finalQrCodeText, // Texto do QR code para copiar e colar
      qrCodeImage: finalQrCodeImage, // Imagem base64 com prefixo data URI
      paymentCode: finalQrCodeText, // Alias para compatibilidade
      paymentCodeBase64: qrCodeImage, // Base64 sem prefixo (para referência)
      transactionId,
      externalId,
      valor,
      status: pixResponse.status || 'pendente',
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hora (expire: 3600 segundos)
    })
  } catch (error: any) {
    console.error('❌ Erro ao criar pagamento PIX:', error)
    console.error('❌ Tipo do erro:', typeof error)
    console.error('❌ Stack:', error?.stack)
    console.error('❌ Mensagem:', error?.message)
    
    // Tratar erros específicos da API Gatebox
    const errorMessage = error?.message || String(error) || 'Erro desconhecido'
    
    // Erro 401 - Não autorizado
    if (errorMessage.includes('401') || errorMessage.includes('Unauthorized') || errorMessage.includes('não autorizado')) {
      return NextResponse.json(
        { error: 'Erro de autenticação. Verifique se username e password estão configurados corretamente no painel admin.' },
        { status: 401 }
      )
    }
    
    // Erro 422 - Validação
    if (errorMessage.includes('422') || errorMessage.includes('validação') || errorMessage.includes('validation')) {
      return NextResponse.json(
        { error: 'Dados inválidos. Verifique os dados informados (valor, documento) e tente novamente.' },
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
