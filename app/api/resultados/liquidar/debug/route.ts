import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { extracoes } from '@/data/extracoes'
import { getHorarioRealApuracao, temSorteioNoDia } from '@/data/horarios-reais-apuracao'
import { buscarResultadosPorNome } from '@/lib/bichocerto-parser'

/**
 * GET /api/resultados/liquidar/debug
 * 
 * Endpoint de debug para diagnóstico de liquidação
 * 
 * Query params:
 * - loteria: filtrar por loteria específica
 * - dataConcurso: filtrar por data específica (formato: YYYY-MM-DD)
 * - horario: filtrar por horário específico
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const loteria = searchParams.get('loteria')
    const dataConcursoParam = searchParams.get('dataConcurso')
    const horario = searchParams.get('horario')

    const debug: any = {
      timestamp: new Date().toISOString(),
      configuracao: {},
      apostas: {},
      resultados: {},
      validacoes: {},
    }

    // 1. Verificar configuração de liquidação automática
    const configuracoes = await prisma.configuracao.findFirst()
    debug.configuracao = {
      liquidacaoAutomatica: configuracoes?.liquidacaoAutomatica ?? true,
      existe: !!configuracoes,
    }

    // 2. Buscar apostas pendentes
    // FILTRO: Apenas apostas do Rio de Janeiro (RJ)
    const where: any = {
      status: 'pendente',
    }

    if (loteria) {
      where.loteria = loteria
    }

    if (dataConcursoParam) {
      const dataConcurso = new Date(dataConcursoParam)
      where.dataConcurso = {
        lte: dataConcurso,
      }
    }

    // Buscar todas as apostas pendentes primeiro
    let todasApostasPendentes = await prisma.aposta.findMany({
      where,
      include: {
        usuario: {
          select: {
            id: true,
            nome: true,
            email: true,
            saldo: true,
          },
        },
      },
      take: 50, // Limitar a 50 para filtrar depois
    })

    // FILTRO: Filtrar apenas apostas do Rio de Janeiro (RJ)
    const apostasPendentes = todasApostasPendentes.filter((aposta) => {
      if (!aposta.loteria) return false
      
      // Buscar extração pelo ID ou nome
      const extracaoId = parseInt(aposta.loteria, 10)
      const extracao = !isNaN(extracaoId)
        ? extracoes.find((e) => e.id === extracaoId)
        : extracoes.find((e) => e.name.toLowerCase() === aposta.loteria?.toLowerCase() || '')
      
      // Apenas processar apostas de extrações do Rio de Janeiro
      return extracao?.estado === 'RJ'
    }).slice(0, 10) // Limitar a 10 após filtrar

    debug.apostas = {
      total: apostasPendentes.length,
      amostra: apostasPendentes.map((aposta) => {
        // Buscar extração pelo ID ou nome
        const extracaoId = parseInt(aposta.loteria || '', 10)
        const extracao = !isNaN(extracaoId)
          ? extracoes.find((e) => e.id === extracaoId)
          : extracoes.find((e) => e.name.toLowerCase() === aposta.loteria?.toLowerCase() || '')
        
        return {
          id: aposta.id,
          loteria: extracao?.name || aposta.loteria || 'N/A',
          horario: extracao?.time || aposta.horario || 'N/A',
          estado: extracao?.estado || 'N/A',
          dataConcurso: aposta.dataConcurso,
          status: aposta.status,
          valor: aposta.valor,
          modalidade: (aposta.detalhes as any)?.modality || 'N/A',
                usuario: {
                  id: aposta.usuario.id,
                  nome: aposta.usuario.nome,
                  saldo: aposta.usuario.saldo,
                },
        }
      }),
    }

    // 3. Para cada aposta, verificar resultados disponíveis
    const resultadosDebug: any[] = []

    for (const aposta of apostasPendentes.slice(0, 5)) {
      // Limitar a 5 para não fazer muitas requisições
      try {
        // Buscar extração pelo ID ou nome
        const extracaoId = parseInt(aposta.loteria || '', 10)
        const extracao = !isNaN(extracaoId)
          ? extracoes.find((e) => e.id === extracaoId)
          : extracoes.find((e) => e.name.toLowerCase() === aposta.loteria?.toLowerCase() || '')
        
        if (!extracao || extracao.estado !== 'RJ') {
          resultadosDebug.push({
            apostaId: aposta.id,
            erro: `Extração não é do RJ (Estado: ${extracao?.estado || 'N/A'})`,
          })
          continue
        }

        const dataConcurso = aposta.dataConcurso
          ? new Date(aposta.dataConcurso).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0]

        // Verificar horário de apuração
        const horarioReal = getHorarioRealApuracao(extracao.name, extracao.time || '')
        const jaPassou = horarioReal
          ? (() => {
              const dataApuracao = new Date(dataConcurso)
              const [hora, minuto] = horarioReal.closeTimeReal.split(':').map(Number)
              dataApuracao.setHours(hora, minuto, 0, 0)
              return new Date() >= dataApuracao
            })()
          : false

        // Buscar resultados apenas para RJ
        let resultadosEncontrados: any[] = []
        try {
          const resultados = await buscarResultadosPorNome(extracao.name, dataConcurso)
          resultadosEncontrados = resultados.map((r) => ({
            horario: r.horario,
            titulo: r.titulo,
            premios: r.premios.length,
            posicoes: r.premios.map((p) => p.posicao),
          }))
        } catch (error) {
          resultadosEncontrados = [
            {
              erro: error instanceof Error ? error.message : 'Erro desconhecido',
            },
          ]
        }
        
        resultadosDebug.push({
          apostaId: aposta.id,
          loteria: extracao.name,
          horario: extracao.time,
          estado: extracao.estado,
          dataConcurso,
          horarioReal: horarioReal
            ? {
                startTime: horarioReal.startTimeReal,
                closeTime: horarioReal.closeTimeReal,
              }
            : null,
          jaPassouHorarioApuracao: jaPassou,
          resultadosEncontrados,
        })
      } catch (error) {
        resultadosDebug.push({
          apostaId: aposta.id,
          erro: error instanceof Error ? error.message : 'Erro desconhecido',
        })
      }
    }

    debug.resultados = {
      totalVerificados: resultadosDebug.length,
      detalhes: resultadosDebug,
    }

    // 4. Validações gerais
    debug.validacoes = {
      extracoesAtivas: extracoes.filter((e) => e.active).length,
      totalExtracaoes: extracoes.length,
      parserDisponivel: typeof buscarResultadosPorNome === 'function',
    }

    return NextResponse.json(debug, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  } catch (error) {
    console.error('Erro no endpoint de debug:', error)
    return NextResponse.json(
      {
        error: 'Erro ao gerar debug',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}
