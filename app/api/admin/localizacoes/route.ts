import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { parseSessionToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/admin/localizacoes
 * Retorna todas as localizações dos usuários para exibição no mapa
 */
export async function GET(req: NextRequest) {
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

    // Buscar parâmetros de query
    const { searchParams } = new URL(req.url)
    const tipo = searchParams.get('tipo') // 'cadastro', 'aposta', 'login', ou null para todos
    const usuarioId = searchParams.get('usuarioId') // Filtrar por usuário específico

    // Construir filtros
    const where: any = {}
    if (tipo) {
      where.tipo = tipo
    }
    if (usuarioId) {
      where.usuarioId = parseInt(usuarioId, 10)
    }

    // Buscar localizações com dados do usuário
    const localizacoes = await prisma.usuarioLocalizacao.findMany({
      where,
      include: {
        Usuario: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 1000, // Limitar a 1000 registros para performance
    })

    // Agrupar por usuário e tipo para evitar muitos marcadores no mapa
    // Pegar apenas a localização mais recente de cada combinação usuário+tipo
    const localizacoesUnicas = new Map<string, typeof localizacoes[0]>()
    
    for (const loc of localizacoes) {
      if (loc.latitude && loc.longitude) {
        const key = `${loc.usuarioId}-${loc.tipo}`
        const existing = localizacoesUnicas.get(key)
        if (!existing || new Date(loc.createdAt) > new Date(existing.createdAt)) {
          localizacoesUnicas.set(key, loc)
        }
      }
    }

    return NextResponse.json({
      localizacoes: Array.from(localizacoesUnicas.values()),
      total: localizacoes.length,
      unicas: localizacoesUnicas.size,
    })
  } catch (error) {
    console.error('Erro ao buscar localizações:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar localizações' },
      { status: 500 }
    )
  }
}
