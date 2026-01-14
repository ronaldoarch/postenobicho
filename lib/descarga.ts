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

    const position = detalhes.betData.position
    if (!position) continue

    // Verificar se a posição inclui o prêmio solicitado
    let incluiPremio = false

    if (position === '1st') {
      incluiPremio = premio === 1
    } else if (position.includes('-')) {
      const [from, to] = position.split('-').map(Number)
      incluiPremio = premio >= from && premio <= to
    }

    if (incluiPremio) {
      total += aposta.valor
    }
  }

  return total
}
