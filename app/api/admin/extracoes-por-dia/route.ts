import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { parseSessionToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// Mapeamento de dias da semana
const DIAS_SEMANA: Record<string, number> = {
  'Domingo': 0,
  'Segunda': 1,
  'Terça': 2,
  'Quarta': 3,
  'Quinta': 4,
  'Sexta': 5,
  'Sábado': 6,
}

const DIAS_SEMANA_REVERSE: Record<number, string> = {
  0: 'Domingo',
  1: 'Segunda',
  2: 'Terça',
  3: 'Quarta',
  4: 'Quinta',
  5: 'Sexta',
  6: 'Sábado',
}

export async function GET() {
  const session = cookies().get('lotbicho_session')?.value
  const user = parseSessionToken(session)

  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  try {
    // Buscar todas as configurações
    const configuracoes = await prisma.configuracaoExtracoesPorDia.findMany({
      where: { ativo: true },
      orderBy: [{ diaSemana: 'asc' }, { extracaoId: 'asc' }],
    })

    // Buscar todas as extrações ativas
    const { extracoes } = await import('@/data/extracoes')
    const extracoesAtivas = extracoes.filter(e => e.active)

    // Organizar por dia da semana
    const configPorDia: Record<number, number[]> = {}
    configuracoes.forEach(config => {
      if (!configPorDia[config.diaSemana]) {
        configPorDia[config.diaSemana] = []
      }
      configPorDia[config.diaSemana].push(config.extracaoId)
    })

    // Criar estrutura completa com todos os dias e extrações
    const resultado = Object.entries(DIAS_SEMANA).map(([nomeDia, numeroDia]) => ({
      dia: nomeDia,
      diaSemana: numeroDia,
      extracoesPermitidas: configPorDia[numeroDia] || [],
      todasExtracoes: extracoesAtivas.map(e => ({
        id: e.id,
        name: e.name,
        estado: e.estado,
        time: e.time,
        days: e.days,
      })),
    }))

    return NextResponse.json({ configuracoes: resultado })
  } catch (error) {
    console.error('Erro ao buscar configurações de extrações por dia:', error)
    return NextResponse.json({ error: 'Erro ao buscar configurações' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const session = cookies().get('lotbicho_session')?.value
  const user = parseSessionToken(session)

  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { diaSemana, extracaoIds } = body

    if (typeof diaSemana !== 'number' || diaSemana < 0 || diaSemana > 6) {
      return NextResponse.json({ error: 'Dia da semana inválido' }, { status: 400 })
    }

    if (!Array.isArray(extracaoIds)) {
      return NextResponse.json({ error: 'extracaoIds deve ser um array' }, { status: 400 })
    }

    // Desativar todas as configurações deste dia
    await prisma.configuracaoExtracoesPorDia.updateMany({
      where: { diaSemana },
      data: { ativo: false },
    })

    // Criar/ativar configurações para as extrações selecionadas
    if (extracaoIds.length > 0) {
      await Promise.all(
        extracaoIds.map((extracaoId: number) =>
          prisma.configuracaoExtracoesPorDia.upsert({
            where: {
              diaSemana_extracaoId: {
                diaSemana,
                extracaoId,
              },
            },
            update: {
              ativo: true,
            },
            create: {
              diaSemana,
              extracaoId,
              ativo: true,
            },
          })
        )
      )
    }

    return NextResponse.json({ 
      message: 'Configurações salvas com sucesso',
      diaSemana,
      extracaoIds,
    })
  } catch (error) {
    console.error('Erro ao salvar configurações de extrações por dia:', error)
    return NextResponse.json({ error: 'Erro ao salvar configurações' }, { status: 500 })
  }
}
