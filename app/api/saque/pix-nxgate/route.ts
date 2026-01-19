import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { parseSessionToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { nxgateSaquePix, type NxgateSaquePixPayload } from '@/lib/nxgate-client'

export const dynamic = 'force-dynamic'

/**
 * Solicita um saque PIX via Nxgate
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
      select: { id: true, nome: true, email: true, saldo: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    const { valor, chavePix, tipoChave } = await req.json()

    if (!valor || valor <= 0) {
      return NextResponse.json({ error: 'Valor inválido' }, { status: 400 })
    }

    if (!chavePix) {
      return NextResponse.json({ error: 'Chave PIX é obrigatória' }, { status: 400 })
    }

    if (!tipoChave || !['CPF', 'CNPJ', 'PHONE', 'EMAIL', 'RANDOM'].includes(tipoChave)) {
      return NextResponse.json(
        { error: 'Tipo de chave inválido. Use: CPF, CNPJ, PHONE, EMAIL ou RANDOM' },
        { status: 400 }
      )
    }

    // Verificar saldo suficiente
    if (user.saldo < valor) {
      return NextResponse.json(
        { error: 'Saldo insuficiente para realizar o saque' },
        { status: 400 }
      )
    }

    // Verificar limites de saque (se configurado)
    const limiteMinimo = parseFloat(process.env.SAQUE_MINIMO || '10')
    const limiteMaximo = parseFloat(process.env.SAQUE_MAXIMO || '10000')

    if (valor < limiteMinimo) {
      return NextResponse.json(
        { error: `Valor mínimo para saque é R$ ${limiteMinimo.toFixed(2)}` },
        { status: 400 }
      )
    }

    if (valor > limiteMaximo) {
      return NextResponse.json(
        { error: `Valor máximo para saque é R$ ${limiteMaximo.toFixed(2)}` },
        { status: 400 }
      )
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

    // URL do webhook (usar do gateway, variável de ambiente ou construir automaticamente)
    const finalWebhookUrl = webhookUrl || process.env.NXGATE_WEBHOOK_URL || `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/webhooks/nxgate`

    // Payload conforme documentação do Nxgate
    const saquePayload: NxgateSaquePixPayload = {
      api_key: apiKey,
      valor: parseFloat(valor.toFixed(2)),
      chave_pix: chavePix,
      tipo_chave: tipoChave,
      webhook: finalWebhookUrl,
    }

    console.log('=== DEBUG SAQUE PIX NXGATE ===')
    console.log('Gateway ID:', gateway?.id || 'N/A (variável de ambiente)')
    console.log('Base URL:', baseUrl)
    console.log('API Key:', apiKey ? `${apiKey.substring(0, 10)}...` : 'MISSING')
    console.log('Payload:', {
      valor: saquePayload.valor,
      tipo_chave: saquePayload.tipo_chave,
      chave_pix: saquePayload.chave_pix ? `${saquePayload.chave_pix.substring(0, 3)}***` : 'missing',
      webhook: saquePayload.webhook,
    })
    console.log('========================')

    // Solicitar saque PIX via Nxgate
    const saqueResponse = await nxgateSaquePix({ apiKey, baseUrl }, saquePayload)
    console.log('Resposta recebida:', saqueResponse)

    const transactionId = saqueResponse.idTransaction

    if (!transactionId) {
      console.error('Resposta do Nxgate:', saqueResponse)
      return NextResponse.json({ error: 'ID da transação não retornado pela API' }, { status: 500 })
    }

    // Debitar saldo do usuário
    await prisma.usuario.update({
      where: { id: user.id },
      data: {
        saldo: {
          decrement: valor,
        },
      },
    })

    // Criar registro do saque
    const saque = await prisma.saque.create({
      data: {
        usuarioId: user.id,
        valor,
        status: 'pendente',
        chavePix: chavePix,
        tipoChavePix: tipoChave,
        referenciaExterna: transactionId,
        gatewayId: gateway?.id,
      },
    })

    // Criar registro da transação
    await prisma.transacao.create({
      data: {
        usuarioId: user.id,
        tipo: 'saque',
        status: 'pendente',
        valor,
        referenciaExterna: transactionId,
        gatewayId: gateway?.id,
        descricao: `Saque PIX via Nxgate - Aguardando processamento`,
      },
    })

    return NextResponse.json({
      success: true,
      transactionId,
      saqueId: saque.id,
      valor,
      status: saqueResponse.status || 'pendente',
      message: 'Saque solicitado com sucesso. Aguarde a confirmação.',
    })
  } catch (error: any) {
    console.error('Erro ao solicitar saque PIX:', error)
    
    // Tratar erros específicos da API Nxgate
    const errorMessage = error.message || ''
    
    // Erro 401 - Não autorizado
    if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
      return NextResponse.json(
        { error: 'Erro de autenticação. Verifique se a API key está configurada corretamente.' },
        { status: 401 }
      )
    }
    
    // Erro 403 - Proibido
    if (errorMessage.includes('403') || errorMessage.includes('Forbidden')) {
      return NextResponse.json(
        { error: 'Operação não permitida. Verifique suas permissões.' },
        { status: 403 }
      )
    }
    
    // Erro 422 - Validação
    if (errorMessage.includes('422')) {
      return NextResponse.json(
        { error: 'Dados inválidos. Verifique os dados informados e tente novamente.' },
        { status: 422 }
      )
    }
    
    // Erro genérico
    return NextResponse.json(
      { error: errorMessage || 'Erro ao solicitar saque PIX. Tente novamente ou entre em contato com o suporte.' },
      { status: 500 }
    )
  }
}
