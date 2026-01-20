/**
 * Sistema de Descarga / Controle de Banca por Modalidade e Prêmio
 */

import { prisma } from './prisma'

export interface LimiteDescargaInput {
  modalidade: string
  premio: number // 1 ao 5
  limite: number
}

export interface AlertaDescarga {
  modalidade: string
  premio: number
  valorAtual: number
  limite: number
  excedente: number
}

/**
 * Registra ou atualiza um limite de descarga
 */
export async function definirLimiteDescarga(input: LimiteDescargaInput) {
  if (input.premio < 1 || input.premio > 5) {
    throw new Error('Prêmio deve estar entre 1 e 5')
  }

  return await prisma.limiteDescarga.upsert({
    where: {
      modalidade_premio: {
        modalidade: input.modalidade,
        premio: input.premio,
      },
    },
    update: {
      limite: input.limite,
      ativo: true,
    },
    create: {
      modalidade: input.modalidade,
      premio: input.premio,
      limite: input.limite,
      ativo: true,
    },
  })
}

/**
 * Verifica se uma aposta excede o limite e cria alerta se necessário
 */
export async function verificarLimiteDescarga(
  modalidade: string,
  premio: number,
  valorAposta: number
): Promise<{ excedeu: boolean; alerta?: AlertaDescarga }> {
  const limite = await prisma.limiteDescarga.findUnique({
    where: {
      modalidade_premio: {
        modalidade,
        premio,
      },
    },
  })

  if (!limite || !limite.ativo) {
    return { excedeu: false }
  }

  // Buscar total apostado nesta modalidade/prêmio
  const valorAtual = await calcularTotalApostadoPorPremio(modalidade, premio)
  const valorTotalComNovaAposta = valorAtual + valorAposta
  const excedeu = valorTotalComNovaAposta > limite.limite

  if (excedeu) {
    const excedente = valorTotalComNovaAposta - limite.limite

    // Buscar alerta existente ou criar novo
    const alertaExistente = await prisma.alertaDescarga.findFirst({
      where: {
        modalidade,
        premio,
        resolvido: false,
      },
    })

    if (alertaExistente) {
      await prisma.alertaDescarga.update({
        where: { id: alertaExistente.id },
        data: {
          valorAtual: valorTotalComNovaAposta,
          excedente,
        },
      })
    } else {
      await prisma.alertaDescarga.create({
        data: {
          modalidade,
          premio,
          valorAtual: valorTotalComNovaAposta,
          limite: limite.limite,
          excedente,
          resolvido: false,
        },
      })
    }

    return {
      excedeu: true,
      alerta: {
        modalidade,
        premio,
        valorAtual: valorTotalComNovaAposta,
        limite: limite.limite,
        excedente,
      },
    }
  }

  return { excedeu: false }
}

/**
 * Busca todos os alertas de descarga não resolvidos
 */
export async function buscarAlertasDescarga() {
  return await prisma.alertaDescarga.findMany({
    where: {
      resolvido: false,
    },
    orderBy: [
      { excedente: 'desc' },
      { createdAt: 'desc' },
    ],
  })
}

/**
 * Marca um alerta como resolvido
 */
export async function resolverAlertaDescarga(id: number) {
  return await prisma.alertaDescarga.update({
    where: { id },
    data: { resolvido: true },
  })
}

/**
 * Calcula o total apostado por modalidade e prêmio
 */
export async function calcularTotalApostadoPorPremio(
  modalidade: string,
  premio: number
): Promise<number> {
  // Buscar todas as apostas pendentes da modalidade
  const apostas = await prisma.aposta.findMany({
    where: {
      modalidade,
      status: 'pendente',
    },
    select: {
      valor: true,
      detalhes: true,
    },
  })

  let total = 0

  for (const aposta of apostas) {
    const detalhes = aposta.detalhes as any
    if (!detalhes?.betData) continue

    // Usar posição personalizada se disponível, senão usar posição padrão
    const betData = detalhes.betData
    const positionToUse = betData.customPosition && betData.customPositionValue 
      ? betData.customPositionValue.trim() 
      : betData.position

    if (!positionToUse) continue

    // Verificar se a posição inclui o prêmio solicitado
    let incluiPremio = false

    // Limpar formatação (remover "º", espaços, etc.)
    const cleanedPos = positionToUse.replace(/º/g, '').replace(/\s/g, '')

    if (cleanedPos === '1st' || cleanedPos === '1') {
      incluiPremio = premio === 1
    } else if (cleanedPos.includes('-')) {
      // Range: "1-5", "2-7", etc.
      const [from, to] = cleanedPos.split('-').map(Number)
      if (!isNaN(from) && !isNaN(to)) {
        incluiPremio = premio >= from && premio <= to
      }
    } else {
      // Posição única: "2", "3", "7", etc.
      const singlePos = parseInt(cleanedPos, 10)
      if (!isNaN(singlePos) && singlePos >= 1 && singlePos <= 7) {
        incluiPremio = premio === singlePos
      }
    }

    if (incluiPremio) {
      total += aposta.valor
    }
  }

  return total
}

/**
 * Busca todas as apostas pendentes por modalidade e prêmio para relatório
 */
export async function buscarApostasPorPremio(
  modalidade: string,
  premio: number
) {
  // Buscar todas as apostas pendentes da modalidade
  const apostas = await prisma.aposta.findMany({
    where: {
      modalidade,
      status: 'pendente',
    },
    select: {
      id: true,
      valor: true,
      detalhes: true,
      dataConcurso: true,
      horario: true,
      loteria: true,
      createdAt: true,
      usuario: {
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
  })

  const apostasFiltradas = []

  for (const aposta of apostas) {
    const detalhes = aposta.detalhes as any
    if (!detalhes?.betData) continue

    // Usar posição personalizada se disponível, senão usar posição padrão
    const betData = detalhes.betData
    const positionToUse = betData.customPosition && betData.customPositionValue 
      ? betData.customPositionValue.trim() 
      : betData.position

    if (!positionToUse) continue

    // Verificar se a posição inclui o prêmio solicitado
    let incluiPremio = false

    // Limpar formatação (remover "º", espaços, etc.)
    const cleanedPos = positionToUse.replace(/º/g, '').replace(/\s/g, '')

    if (cleanedPos === '1st' || cleanedPos === '1') {
      incluiPremio = premio === 1
    } else if (cleanedPos.includes('-')) {
      // Range: "1-5", "2-7", etc.
      const [from, to] = cleanedPos.split('-').map(Number)
      if (!isNaN(from) && !isNaN(to)) {
        incluiPremio = premio >= from && premio <= to
      }
    } else {
      // Posição única: "2", "3", "7", etc.
      const singlePos = parseInt(cleanedPos, 10)
      if (!isNaN(singlePos) && singlePos >= 1 && singlePos <= 7) {
        incluiPremio = premio === singlePos
      }
    }

    if (incluiPremio) {
      // Extrair informações do palpite
      let palpite = ''
      if (betData.numberBets && betData.numberBets.length > 0) {
        palpite = betData.numberBets.join(', ')
      } else if (betData.animalBets && betData.animalBets.length > 0) {
        palpite = betData.animalBets.map((grupo: string[]) => grupo.join(' ')).join(', ')
      }

      apostasFiltradas.push({
        id: aposta.id,
        valor: aposta.valor,
        palpite,
        data: aposta.dataConcurso || aposta.createdAt,
        horario: aposta.horario,
        loteria: aposta.loteria,
        usuario: aposta.usuario,
        posicao: positionToUse,
      })
    }
  }

  return apostasFiltradas
}
