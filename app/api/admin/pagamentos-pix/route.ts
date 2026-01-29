import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-auth'
import { nxgateSaquePix, type NxgateSaquePixPayload } from '@/lib/nxgate-client'
import { gateboxWithdrawPix, type GateboxWithdrawPixPayload } from '@/lib/gatebox-client'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/pagamentos-pix
 * Lista todos os pagamentos PIX
 */
export async function GET(request: NextRequest) {
  const adminCheck = await requireAdmin(request)
  if (adminCheck instanceof NextResponse) {
    return adminCheck
  }

  const { userId } = adminCheck

  try {
    const { searchParams } = new URL(request.url)
    const dataInicio = searchParams.get('dataInicio')
    const dataFim = searchParams.get('dataFim')

    // Construir filtro de data
    const buildDateFilter = (field: string) => {
      const inicio = dataInicio ? new Date(dataInicio + 'T00:00:00.000Z') : null
      const fim = dataFim ? new Date(dataFim + 'T23:59:59.999Z') : null

      if (inicio && fim) {
        return { [field]: { gte: inicio, lte: fim } }
      } else if (inicio) {
        return { [field]: { gte: inicio } }
      } else if (fim) {
        return { [field]: { lte: fim } }
      }
      return {}
    }

    const pagamentos = await prisma.pagamentoPix.findMany({
      where: buildDateFilter('createdAt'),
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Buscar dados do admin separadamente se necessário
    const pagamentosComAdmin = await Promise.all(
      pagamentos.map(async (pagamento) => {
        if (pagamento.adminId) {
          const admin = await prisma.usuario.findUnique({
            where: { id: pagamento.adminId },
            select: { nome: true, email: true },
          })
          return { ...pagamento, admin }
        }
        return { ...pagamento, admin: null }
      })
    )

    // Calcular total
    const totalPagamentos = pagamentosComAdmin.reduce((sum, p) => sum + Number(p.valor || 0), 0)

    return NextResponse.json({
      pagamentos: pagamentosComAdmin,
      total: totalPagamentos,
      quantidade: pagamentos.length,
    })
  } catch (error) {
    console.error('Erro ao buscar pagamentos PIX:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar pagamentos PIX' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/pagamentos-pix
 * Cria um novo pagamento PIX (realiza saque do sistema)
 */
export async function POST(request: NextRequest) {
  const adminCheck = await requireAdmin(request)
  if (adminCheck instanceof NextResponse) {
    return adminCheck
  }

  const { userId } = adminCheck

  try {
    const body = await request.json()
    const { chavePix, nomeRecebedor, valor, nota } = body

    if (!chavePix || !nomeRecebedor || !valor) {
      return NextResponse.json(
        { error: 'Chave PIX, nome do recebedor e valor são obrigatórios' },
        { status: 400 }
      )
    }

    const valorNum = Number(valor)
    if (isNaN(valorNum) || valorNum <= 0) {
      return NextResponse.json(
        { error: 'Valor deve ser um número positivo' },
        { status: 400 }
      )
    }

    // Validar limites de saque (se configurado)
    const limiteMinimo = parseFloat(process.env.SAQUE_MINIMO || '10')
    const limiteMaximo = parseFloat(process.env.SAQUE_MAXIMO || '10000')

    if (valorNum < limiteMinimo) {
      return NextResponse.json(
        { error: `Valor mínimo para pagamento é R$ ${limiteMinimo.toFixed(2)}` },
        { status: 400 }
      )
    }

    if (valorNum > limiteMaximo) {
      return NextResponse.json(
        { error: `Valor máximo para pagamento é R$ ${limiteMaximo.toFixed(2)}` },
        { status: 400 }
      )
    }

    // Detectar tipo de chave PIX automaticamente
    const chaveLimpa = chavePix.replace(/\D/g, '')
    let tipoChave: 'CPF' | 'CNPJ' | 'PHONE' | 'EMAIL' | 'RANDOM' = 'RANDOM'
    let chavePixFormatada = chavePix.trim()

    if (chaveLimpa.length === 11) {
      tipoChave = 'CPF'
      chavePixFormatada = chaveLimpa
    } else if (chaveLimpa.length === 14) {
      tipoChave = 'CNPJ'
      chavePixFormatada = chaveLimpa
    } else if (chaveLimpa.length === 10 || chaveLimpa.length === 11) {
      tipoChave = 'PHONE'
      chavePixFormatada = chaveLimpa
    } else if (chavePix.includes('@')) {
      tipoChave = 'EMAIL'
      chavePixFormatada = chavePix.toLowerCase().trim()
    } else {
      tipoChave = 'RANDOM'
      chavePixFormatada = chavePix.trim()
    }

    // Calcular saldo disponível do sistema
    // Saldo do sistema = Total de Depósitos - Total de Saques de Usuários - Total de Prêmios Pagos - Total de Pagamentos PIX anteriores
    const depositos = await prisma.transacao.findMany({
      where: {
        tipo: 'deposito',
        status: { in: ['aprovado', 'pago'] },
      },
      select: { valor: true },
    })

    // Buscar saques de usuários (excluindo pagamentos PIX de gerentes)
    // Buscar transactionIds dos pagamentos PIX para excluir do cálculo
    const pagamentosPixExistentes = await prisma.pagamentoPix.findMany({
      where: {
        status: { in: ['pendente', 'pago'] }, // Incluir pendentes e pagos
      },
      select: { 
        transactionId: true,
        valor: true,
      },
    })

    const transactionIdsPagamentosPix = pagamentosPixExistentes
      .map(p => p.transactionId)
      .filter((id): id is string => !!id)

    // Buscar todos os saques confirmados (aprovados/pagos)
    const saques = await prisma.saque.findMany({
      where: {
        status: { in: ['aprovado', 'processando', 'saque-pago'] },
      },
      select: { 
        valor: true,
        referenciaExterna: true,
      },
    })

    // Filtrar saques de usuários (excluir pagamentos PIX de gerentes)
    // Pagamentos PIX de gerentes têm referenciaExterna que corresponde ao transactionId do PagamentoPix
    const saquesUsuarios = saques.filter((s) => 
      !s.referenciaExterna || !transactionIdsPagamentosPix.includes(s.referenciaExterna)
    )

    const apostasGanhas = await prisma.aposta.findMany({
      where: {
        status: { in: ['ganhou', 'liquidado'] },
      },
      select: {
        valor: true,
        retornoPrevisto: true,
        detalhes: true,
      },
    })

    // Buscar pagamentos PIX anteriores (apenas os pagos, não pendentes)
    const pagamentosPixAnteriores = await prisma.pagamentoPix.findMany({
      where: {
        status: 'pago', // Apenas pagamentos confirmados
      },
      select: { valor: true },
    })

    const totalDepositos = depositos.reduce((sum, d) => sum + Number(d.valor || 0), 0)
    const totalSaquesUsuarios = saquesUsuarios.reduce((sum, s) => sum + Number(s.valor || 0), 0)
    const totalPremios = apostasGanhas.reduce((sum, a) => {
      const premio = a.detalhes && typeof a.detalhes === 'object' && 'premioTotal' in a.detalhes
        ? Number((a.detalhes as any).premioTotal || 0)
        : Number(a.retornoPrevisto || 0)
      return sum + premio
    }, 0)
    const totalPagamentosPix = pagamentosPixAnteriores.reduce((sum, p) => sum + Number(p.valor || 0), 0)

    const saldoDisponivelSistema = totalDepositos - totalSaquesUsuarios - totalPremios - totalPagamentosPix

    if (valorNum > saldoDisponivelSistema) {
      return NextResponse.json(
        { 
          error: `Saldo insuficiente no sistema. Saldo disponível: R$ ${saldoDisponivelSistema.toFixed(2)}`,
          saldoDisponivel: saldoDisponivelSistema
        },
        { status: 400 }
      )
    }

    // Verificar qual gateway está ativo (prioridade: Gatebox > NXGate)
    const { getActiveGatewayByType } = await import('@/lib/gateways-store')
    const gatebox = await getActiveGatewayByType('gatebox')
    const nxgate = await getActiveGatewayByType('nxgate')
    
    const valorFormatado = parseFloat(valorNum.toFixed(2))
    
    console.log('=== PAGAMENTO PIX GERENTE ===')
    console.log('Chave PIX:', chavePixFormatada)
    console.log('Tipo Chave:', tipoChave)
    console.log('Valor:', valorFormatado)
    console.log('Saldo Disponível Sistema:', saldoDisponivelSistema.toFixed(2))
    console.log('===========================')

    let saqueResponse: any
    let gateway: any
    let transactionId: string | undefined

    // Prioridade: Gatebox > NXGate
    if (gatebox) {
      try {
        // Usar Gatebox
        gateway = gatebox
        const username = gateway.username || process.env.GATEBOX_USERNAME
        const password = gateway.passwordHash || process.env.GATEBOX_PASSWORD
        const baseUrl = gateway.baseUrl || 'https://api.gatebox.com.br'
        
        if (!username || !password) {
          throw new Error('Credenciais do Gatebox não configuradas. Configure username e password no painel admin.')
        }
        
        const externalId = `pag_pix_${userId}_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`
        
        const gateboxPayload: GateboxWithdrawPixPayload = {
          externalId,
          key: chavePixFormatada,
          name: nomeRecebedor,
          amount: valorFormatado,
          description: nota || `Pagamento PIX para ${nomeRecebedor}`,
        }
        
        // Adicionar documentNumber se for CPF ou CNPJ
        if (tipoChave === 'CPF' || tipoChave === 'CNPJ') {
          gateboxPayload.documentNumber = chavePixFormatada
        }
        
        saqueResponse = await gateboxWithdrawPix({ username, password, baseUrl }, gateboxPayload)
        console.log('✅ Resposta recebida do Gatebox:', JSON.stringify(saqueResponse, null, 2))
        
        // A resposta do Gatebox vem no formato { statusCode: 200, data: { ... } }
        const responseData = (saqueResponse as any)?.data || saqueResponse
        transactionId = responseData?.transactionId || responseData?.identifier || responseData?.uuid || externalId
        
      } catch (gateboxError: any) {
        console.error('Erro ao usar Gatebox:', gateboxError.message)
        // Se o erro for de credenciais não configuradas, retornar erro específico
        if (gateboxError.message.includes('Credenciais do Gatebox não configuradas')) {
          return NextResponse.json(
            { error: 'Gateway Gatebox está ativo mas não tem credenciais configuradas. Configure username e password no painel admin (Gateways > Editar Gatebox).' },
            { status: 400 }
          )
        }
        // Se o erro for de IP não autorizado (403), tentar NXGate automaticamente
        if (gateboxError.message.includes('403') || gateboxError.message.includes('IP não autorizado') || gateboxError.message.includes('Acesso negado')) {
          console.log('⚠️ Gatebox retornou erro de autorização (IP não autorizado). Tentando NXGate como fallback...')
          // Continuar para tentar NXGate
        } else {
          // Para outros erros, também tentar NXGate como fallback
          console.log('⚠️ Erro ao usar Gatebox. Tentando NXGate como fallback...')
        }
      }
    }
    
    // Se Gatebox não funcionou ou não está ativo, tentar NXGate
    if (!transactionId && nxgate) {
      try {
        gateway = nxgate
        const apiKey = gateway.apiKey || process.env.NXGATE_API_KEY
        const baseUrl = gateway.baseUrl || 'https://nxgate.com.br'
        const webhookUrl = gateway.webhookUrl || process.env.NXGATE_WEBHOOK_URL
        
        if (!apiKey) {
          throw new Error('Gateway NXGate não configurado. Configure no painel admin ou nas variáveis de ambiente.')
        }

        const finalWebhookUrl = webhookUrl || process.env.NXGATE_WEBHOOK_URL || `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/webhooks/nxgate`

        const saquePayload: NxgateSaquePixPayload = {
          api_key: apiKey,
          valor: valorFormatado,
          chave_pix: chavePixFormatada,
          tipo_chave: tipoChave,
          webhook: finalWebhookUrl,
        }

        saqueResponse = await nxgateSaquePix({ apiKey, baseUrl }, saquePayload)
        console.log('✅ Resposta recebida do NXGate:', JSON.stringify(saqueResponse, null, 2))
        
        transactionId = saqueResponse?.internalreference || 
                        saqueResponse?.idTransaction || 
                        saqueResponse?.id_transaction || 
                        saqueResponse?.transaction_id
                        
      } catch (nxgateError: any) {
        console.error('❌ Erro ao chamar API NXGate:', nxgateError)
        
        if (nxgateError.message && nxgateError.message.includes('NXGate API error')) {
          const statusMatch = nxgateError.message.match(/error (\d+):/)
          const statusCode = statusMatch ? parseInt(statusMatch[1]) : 500
          
          return NextResponse.json(
            { error: `Erro na API NXGate: ${nxgateError.message}` },
            { status: statusCode }
          )
        }
        
        return NextResponse.json(
          { error: `Erro ao processar pagamento: ${nxgateError.message || 'Erro desconhecido'}` },
          { status: 500 }
        )
      }
    }
    
    // Se nenhum gateway funcionou
    if (!transactionId || !gateway) {
      return NextResponse.json(
        { error: 'Nenhum gateway de pagamento ativo encontrado. Configure um gateway no painel admin.' },
        { status: 500 }
      )
    }

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

    // Criar pagamento PIX e transação de saque em uma transação atômica
    const result = await prisma.$transaction(async (tx) => {
      // Criar registro do pagamento PIX
      const pagamento = await tx.pagamentoPix.create({
        data: {
          chavePix: chavePixFormatada,
          nomeRecebedor,
          valor: valorNum,
          nota: nota || null,
          adminId: userId,
          transactionId: transactionId,
          status: 'pendente', // Aguarda confirmação via webhook
        },
      })

      // Buscar usuário admin como referência (não debita dele, apenas para referência)
      const adminUser = await tx.usuario.findFirst({
        where: { admin: true },
        select: { id: true },
      })

      if (!adminUser) {
        throw new Error('Nenhum administrador encontrado no sistema')
      }

      // Criar transação de saque do sistema (status pendente - aguarda confirmação do gateway)
      await tx.transacao.create({
        data: {
          usuarioId: adminUser.id, // Usar ID do admin como referência
          tipo: 'saque',
          status: 'pendente', // Aguarda confirmação via webhook
          valor: valorNum,
          descricao: `Pagamento PIX para ${nomeRecebedor}${nota ? ` - ${nota}` : ''}`,
          referenciaExterna: transactionId,
          gatewayId: gateway?.id,
          updatedAt: new Date(),
        },
      })

      // Criar registro de saque (status pendente - aguarda confirmação via webhook)
      await tx.saque.create({
        data: {
          usuarioId: adminUser.id, // Usar ID do admin como referência
          valor: valorNum,
          status: 'pendente', // Aguarda confirmação via webhook
          chavePix: chavePixFormatada,
          tipoChavePix: tipoChave,
          referenciaExterna: transactionId,
          gatewayId: gateway?.id,
          motivo: nota || `Pagamento PIX para ${nomeRecebedor}`,
          updatedAt: new Date(),
        },
      })

      return { pagamento, transactionId }
    })

    return NextResponse.json({
      message: 'Pagamento PIX solicitado com sucesso. Aguardando confirmação do gateway.',
      pagamento: result.pagamento,
      transactionId: result.transactionId,
      status: 'pendente',
    })
  } catch (error: any) {
    console.error('Erro ao criar pagamento PIX:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao criar pagamento PIX' },
      { status: 500 }
    )
  }
}
