import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { parseSessionToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { geolocateIP, salvarLocalizacaoUsuario } from '@/lib/ip-geolocation'

/**
 * POST /api/admin/localizacoes/geolocalizar-existentes
 * Tenta geolocalizar usuários existentes baseado em suas últimas ações
 * Como não temos IP histórico, vamos usar uma abordagem alternativa:
 * - Buscar usuários que já fizeram ações mas não têm localização
 * - Tentar inferir localização baseada em dados disponíveis (telefone, etc)
 * - Ou criar localizações baseadas em padrões conhecidos
 */
export async function POST(req: NextRequest) {
  try {
    // Verificar autenticação admin
    const session = cookies().get('lotbicho_session')?.value
    const user = parseSessionToken(session)

    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // Verificar se é admin
    const usuario = await prisma.usuario.findUnique({
      where: { id: user.id },
      select: { admin: true },
    })

    if (!usuario?.admin) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const body = await req.json().catch(() => ({}))
    const { usarIPAtual = false } = body

    // Buscar usuários que já fizeram ações
    const usuariosComAcoes = await prisma.usuario.findMany({
      where: {
        OR: [
          { jaApostou: true },
          { Aposta: { some: {} } },
        ],
      },
      select: {
        id: true,
        nome: true,
        email: true,
        telefone: true,
        createdAt: true,
      },
      take: 50, // Processar em lotes
    })

    // Filtrar usuários que não têm localização usando query separada
    const usuariosComLocalizacao = await prisma.usuarioLocalizacao.findMany({
      select: { usuarioId: true },
      distinct: ['usuarioId'],
    })
    const idsComLocalizacao = new Set(usuariosComLocalizacao.map((l: { usuarioId: number }) => l.usuarioId))
    
    const usuariosSemLocalizacao = usuariosComAcoes.filter(u => !idsComLocalizacao.has(u.id))

    const resultados = {
      processados: 0,
      sucesso: 0,
      falhas: 0,
      detalhes: [] as Array<{ usuarioId: number; status: string; mensagem: string }>,
    }

    // Se usarIPAtual, tentar geolocalizar usando o IP atual da requisição
    // (isso não é ideal, mas é uma alternativa quando não temos IP histórico)
    let ipParaUsar: string | null = null
    let geoDataParaUsar: any = null

    if (usarIPAtual) {
      // Obter IP da requisição atual
      const forwardedFor = req.headers.get('x-forwarded-for')
      ipParaUsar = forwardedFor ? forwardedFor.split(',')[0].trim() : null

      if (ipParaUsar) {
        try {
          geoDataParaUsar = await geolocateIP(ipParaUsar)
        } catch (error) {
          console.error('Erro ao geolocalizar IP atual:', error)
        }
      }
    }

    // Para cada usuário, criar uma localização estimada
    for (const usuario of usuariosSemLocalizacao) {
      try {
        resultados.processados++

        // Se temos dados de geolocalização do IP atual, usar
        if (geoDataParaUsar && ipParaUsar) {
          await salvarLocalizacaoUsuario(
            usuario.id,
            ipParaUsar,
            'aposta', // Assumir que é de uma aposta anterior
            geoDataParaUsar
          )
          resultados.sucesso++
          resultados.detalhes.push({
            usuarioId: usuario.id,
            status: 'sucesso',
            mensagem: `Geolocalizado usando IP atual: ${ipParaUsar}`,
          })
        } else {
          // Sem IP histórico, não podemos geolocalizar precisamente
          // Mas podemos criar uma entrada genérica que será atualizada na próxima ação
          resultados.detalhes.push({
            usuarioId: usuario.id,
            status: 'pendente',
            mensagem: 'Sem IP histórico - será geolocalizado na próxima ação do usuário',
          })
        }
      } catch (error) {
        resultados.falhas++
        resultados.detalhes.push({
          usuarioId: usuario.id,
          status: 'erro',
          mensagem: `Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        })
      }
    }

    return NextResponse.json({
      mensagem: 'Processamento concluído',
      resultados,
      nota: usarIPAtual
        ? 'Localizações criadas usando IP atual do servidor (aproximado)'
        : 'Para geolocalização precisa de IP histórico. Usuários serão geolocalizados automaticamente em novas ações.',
    })
  } catch (error) {
    console.error('Erro ao geolocalizar usuários existentes:', error)
    return NextResponse.json(
      { error: 'Erro ao processar geolocalização' },
      { status: 500 }
    )
  }
}
