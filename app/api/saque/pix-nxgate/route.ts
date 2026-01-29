import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { parseSessionToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { nxgateSaquePix, type NxgateSaquePixPayload } from '@/lib/nxgate-client'
import { WebhookTracker } from '@/lib/webhook-tracker'

export const dynamic = 'force-dynamic'

/**
 * Solicita um saque PIX via Nxgate
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
      select: { 
        id: true, 
        nome: true, 
        email: true, 
        saldo: true,
        bonusBloqueado: true,
        rolloverNecessario: true,
        rolloverAtual: true,
        jaApostou: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    const body = await req.json()
    const { valor: valorRaw, chavePix: chavePixRaw, tipoChave } = body

    // Garantir que valor seja um número
    const valor = typeof valorRaw === 'string' 
      ? parseFloat(valorRaw.replace(',', '.')) 
      : Number(valorRaw)

    if (!valor || isNaN(valor) || valor <= 0) {
      console.error('❌ Valor inválido recebido:', valorRaw, typeof valorRaw)
      return NextResponse.json({ error: 'Valor inválido' }, { status: 400 })
    }

    // Limpar chave PIX (remover formatação apenas para CPF/CNPJ/PHONE)
    // Para EMAIL e RANDOM, manter como está
    let chavePix = chavePixRaw ? String(chavePixRaw).trim() : ''
    
    if (tipoChave && ['CPF', 'CNPJ', 'PHONE'].includes(tipoChave)) {
      // Para CPF, CNPJ e PHONE: remover tudo que não é dígito
      chavePix = chavePix.replace(/\D/g, '')
    } else if (tipoChave === 'EMAIL') {
      // Para EMAIL: manter como está, apenas trim e lowercase
      chavePix = chavePix.toLowerCase().trim()
    } else if (tipoChave === 'RANDOM') {
      // Para RANDOM: manter como está, apenas trim
      chavePix = chavePix.trim()
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

    // Validar formato da chave PIX conforme o tipo
    if (tipoChave === 'CPF' && chavePix.length !== 11) {
      return NextResponse.json(
        { error: 'CPF deve ter 11 dígitos' },
        { status: 400 }
      )
    }
    
    if (tipoChave === 'CNPJ' && chavePix.length !== 14) {
      return NextResponse.json(
        { error: 'CNPJ deve ter 14 dígitos' },
        { status: 400 }
      )
    }
    
    if (tipoChave === 'PHONE' && (chavePix.length < 10 || chavePix.length > 11)) {
      return NextResponse.json(
        { error: 'Telefone deve ter 10 ou 11 dígitos' },
        { status: 400 }
      )
    }

    console.log('💰 Valor processado:', valor, 'Tipo:', typeof valor)
    console.log('🔑 Chave PIX processada:', tipoChave, chavePix.length, 'dígitos')

    // REGRA: Usuário precisa apostar pelo menos uma vez antes de poder sacar
    if (!user.jaApostou) {
      return NextResponse.json(
        { 
          error: 'Você precisa apostar pelo menos uma vez antes de poder sacar.',
        },
        { status: 400 }
      )
    }

    // Verificar se há bônus bloqueado ou rollover pendente
    const bonusBloqueado = user.bonusBloqueado || 0
    const rolloverNecessario = user.rolloverNecessario || 0
    const rolloverAtual = user.rolloverAtual || 0
    const rolloverCompleto = rolloverNecessario === 0 || rolloverAtual >= rolloverNecessario

    // O usuário só pode sacar se não tiver bônus bloqueado OU se completou o rollover
    if (bonusBloqueado > 0 && !rolloverCompleto) {
      const rolloverRestante = rolloverNecessario - rolloverAtual
      return NextResponse.json(
        { 
          error: 'Você ainda possui bônus bloqueado. Complete o rollover para liberar o bônus e poder sacar.',
          detalhes: {
            bonusBloqueado: bonusBloqueado.toFixed(2),
            rolloverRestante: rolloverRestante.toFixed(2),
            rolloverAtual: rolloverAtual.toFixed(2),
            rolloverNecessario: rolloverNecessario.toFixed(2),
          }
        },
        { status: 400 }
      )
    }

    // Verificar saldo suficiente (considerando apenas saldo livre, não bônus bloqueado)
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
    // IMPORTANTE: 
    // - chave_pix: SEM formatação para CPF/CNPJ/PHONE, como está para EMAIL/RANDOM
    // - valor: Pode ser number ou string (testar ambos se necessário)
    const valorFormatado = parseFloat(valor.toFixed(2))
    
    // Verificar se a API espera valor como string ou number
    // Por padrão, enviamos como number. Se der erro, tentar como string.
    const saquePayload: NxgateSaquePixPayload = {
      api_key: apiKey,
      valor: valorFormatado, // Number - se der erro, tentar como string: valor.toFixed(2)
      chave_pix: chavePix, // Limpa conforme tipo_chave
      tipo_chave: tipoChave,
      webhook: finalWebhookUrl,
    }
    
    // Validar campos obrigatórios
    if (!saquePayload.api_key || !saquePayload.chave_pix || !saquePayload.valor) {
      console.error('❌ Payload inválido:', {
        api_key: saquePayload.api_key ? 'presente' : 'missing',
        chave_pix: saquePayload.chave_pix ? 'presente' : 'missing',
        valor: saquePayload.valor,
      })
      return NextResponse.json(
        { error: 'Dados inválidos para solicitar saque' },
        { status: 400 }
      )
    }

    // Tentar obter IP do servidor para ajudar no debug
    // IMPORTANTE: O IP do servidor é diferente do IP do cliente
    // O IP que o Nxgate vê é o IP de origem da conexão TCP do servidor
    let serverIP = 'Não disponível'
    try {
      // Usar variável de ambiente se configurada, senão tentar descobrir
      if (process.env.SERVER_IP) {
        serverIP = process.env.SERVER_IP
      } else {
        // Tentar descobrir o IP público do servidor (não do cliente!)
        // O IP do cliente está em req.headers, mas não é o que o Nxgate vê
        const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0] || req.headers.get('x-real-ip') || 'N/A'
        serverIP = `IP do servidor não configurado (IP do cliente: ${clientIP})`
      }
    } catch (e) {
      // Ignorar erro
    }

    console.log('=== DEBUG SAQUE PIX NXGATE ===')
    console.log('Gateway ID:', gateway?.id || 'N/A (variável de ambiente)')
    console.log('Base URL:', baseUrl)
    console.log('Endpoint:', `${baseUrl}/api/pix/sacar`)
    console.log('API Key:', apiKey ? `${apiKey.substring(0, 10)}...` : 'MISSING')
    console.log('Server IP configurado:', serverIP)
    console.log('⚠️  IMPORTANTE: O Nxgate vê o IP de origem da conexão TCP do servidor.')
    console.log('⚠️  Configure SERVER_IP no .env com o IP público do servidor (104.218.52.159).')
    console.log('⚠️  O IP do cliente não é usado pelo Nxgate - apenas o IP do servidor.')
    console.log('')
    console.log('📤 PAYLOAD ENVIADO (JSON):')
    console.log(JSON.stringify({
      api_key: saquePayload.api_key ? `${saquePayload.api_key.substring(0, 10)}...` : 'missing',
      valor: saquePayload.valor,
      valor_tipo: typeof saquePayload.valor,
      chave_pix: saquePayload.chave_pix ? `${saquePayload.chave_pix.substring(0, 3)}***` : 'missing',
      chave_pix_length: saquePayload.chave_pix?.length || 0,
      tipo_chave: saquePayload.tipo_chave,
      webhook: saquePayload.webhook || 'não enviado',
    }, null, 2))
    console.log('')
    console.log('📤 PAYLOAD RAW (para debug):')
    console.log(JSON.stringify(saquePayload, null, 2).replace(/"api_key":\s*"[^"]+"/, '"api_key": "***"').replace(/"chave_pix":\s*"[^"]+"/, '"chave_pix": "***"'))
    console.log('========================')

    // Solicitar saque PIX via Nxgate
    let saqueResponse: any
    try {
      saqueResponse = await nxgateSaquePix({ apiKey, baseUrl }, saquePayload)
      console.log('✅ Resposta recebida do Nxgate:', JSON.stringify(saqueResponse, null, 2))
    } catch (nxgateError: any) {
      console.error('❌ Erro ao chamar API Nxgate:', nxgateError)
      console.error('❌ Stack:', nxgateError.stack)
      console.error('❌ Mensagem:', nxgateError.message)
      
      // Se o erro já tem uma mensagem específica, usar ela
      if (nxgateError.message && nxgateError.message.includes('Nxgate API error')) {
        const statusMatch = nxgateError.message.match(/error (\d+):/)
        const statusCode = statusMatch ? parseInt(statusMatch[1]) : 500
        
        // Mensagem mais específica para 403
        if (statusCode === 403) {
          let errorMessage = 'Operação não permitida.'
          
          // Verificar se é erro de IP não autorizado
          if (nxgateError.message.includes('IP não autorizado') || nxgateError.message.includes('IP nao autorizado')) {
            // Tentar obter o IP do servidor
            const serverIP = process.env.SERVER_IP || 'IP do servidor não configurado'
            errorMessage = `IP do servidor não autorizado no Nxgate. Autorize o IP ${serverIP} no painel do Nxgate.`
          } else if (nxgateError.message.includes('permissão') || nxgateError.message.includes('permissao')) {
            errorMessage = 'Operação não permitida. Verifique se a API key tem permissão para saques.'
          }
          
          return NextResponse.json(
            { 
              error: errorMessage,
              details: nxgateError.message,
              ...(process.env.NODE_ENV === 'development' && {
                serverIP: process.env.SERVER_IP || 'Não configurado'
              })
            },
            { status: 403 }
          )
        }
        
        return NextResponse.json(
          { error: `Erro na API Nxgate: ${nxgateError.message}` },
          { status: statusCode }
        )
      }
      
      throw nxgateError // Re-throw para ser capturado pelo catch externo
    }

    // O Nxgate retorna 'internalreference' como ID da transação
    const transactionId = saqueResponse?.internalreference || 
                          saqueResponse?.idTransaction || 
                          saqueResponse?.id_transaction || 
                          saqueResponse?.transaction_id

    if (!transactionId) {
      console.error('❌ ID da transação não encontrado na resposta:', JSON.stringify(saqueResponse, null, 2))
      return NextResponse.json(
        { 
          error: 'ID da transação não retornado pela API',
          debug: process.env.NODE_ENV === 'development' ? saqueResponse : undefined
        },
        { status: 500 }
      )
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

    // Enviar webhook de saque solicitado
    WebhookTracker.saque(user.id, saque.id, valor, 'pendente').catch(err => {
      console.error(`Erro ao enviar webhook de saque para saque ${saque.id}:`, err)
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
        updatedAt: new Date(),
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
      let errorMsg = 'Operação não permitida.'
      
      if (errorMessage.includes('IP não autorizado') || errorMessage.includes('IP nao autorizado')) {
        errorMsg = 'IP do servidor não autorizado para saques no Nxgate. Autorize o IP na seção de Saques (cash-out) do painel do Nxgate. Nota: Depósitos podem funcionar mesmo que saques não funcionem, pois podem ter whitelist separada.'
      } else if (errorMessage.includes('permissão') || errorMessage.includes('permissao')) {
        errorMsg = 'API key não tem permissão para saques. Verifique as permissões da API key no painel do Nxgate e ative a opção "Permitir saques" (cash-out).'
      }
      
      return NextResponse.json(
        { error: errorMsg },
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
