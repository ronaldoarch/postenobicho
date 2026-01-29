import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { parseSessionToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { geolocateIP, salvarLocalizacaoUsuario } from '@/lib/ip-geolocation'

/**
 * POST /api/admin/localizacoes/geolocalizar-usuarios
 * Geolocaliza usuários existentes baseado em suas últimas ações (apostas, etc)
 * Como não temos IP histórico, vamos tentar geolocalizar baseado em dados disponíveis
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

    // Buscar todos os usuários que ainda não têm localização
    const usuariosSemLocalizacao = await prisma.usuario.findMany({
      where: {
        localizacoes: {
          none: {}, // Usuários sem nenhuma localização
        },
      },
      select: {
        id: true,
        nome: true,
        email: true,
        createdAt: true,
      },
      take: 100, // Limitar para não sobrecarregar
    })

    const resultados = {
      processados: 0,
      sucesso: 0,
      falhas: 0,
      detalhes: [] as Array<{ usuarioId: number; status: string; mensagem: string }>,
    }

    // Para cada usuário, tentar obter IP de suas últimas apostas ou ações
    // Como não temos IP histórico, vamos criar uma localização genérica baseada em dados disponíveis
    // ou tentar usar um IP estimado (isso é uma limitação - sem IP histórico não podemos geolocalizar precisamente)
    
    for (const usuario of usuariosSemLocalizacao) {
      try {
        // Buscar última aposta do usuário para tentar inferir localização
        const ultimaAposta = await prisma.aposta.findFirst({
          where: { usuarioId: usuario.id },
          orderBy: { createdAt: 'desc' },
          select: { createdAt: true, loteria: true },
        })

        // Como não temos IP histórico, vamos usar uma abordagem alternativa:
        // Criar uma localização "estimada" baseada em dados do usuário
        // OU tentar geolocalizar usando um serviço que aceita outros dados
        
        // Por enquanto, vamos criar uma entrada genérica que será atualizada quando o usuário fizer uma nova ação
        // Mas o ideal seria ter IP histórico - vamos adicionar um campo de "IP estimado" ou similar
        
        resultados.processados++
        resultados.detalhes.push({
          usuarioId: usuario.id,
          status: 'pendente',
          mensagem: 'Sem IP histórico disponível - será geolocalizado na próxima ação',
        })
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
      nota: 'Para geolocalização precisa de IP histórico. Usuários serão geolocalizados automaticamente em novas ações.',
    })
  } catch (error) {
    console.error('Erro ao geolocalizar usuários:', error)
    return NextResponse.json(
      { error: 'Erro ao processar geolocalização' },
      { status: 500 }
    )
  }
}
