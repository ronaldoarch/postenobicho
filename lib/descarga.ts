/**
 * Sistema de Descarga / Controle de Banca por Modalidade e Prêmio
 */

import { prisma } from './prisma'

export interface LimiteDescargaInput {
  modalidade: string
  premio: number // 1 ao 5
  limite: number
  loteria?: string // Loteria/extracao - opcional ("" = limite geral)
  horario?: string // Horário da extração - sempre "" (não usado)
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
      modalidade_premio_loteria_horario: {
        modalidade: input.modalidade,
        premio: input.premio,
        loteria: input.loteria || '',
        horario: input.horario || '',
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
      loteria: input.loteria || '',
      horario: input.horario || '',
      ativo: true,
    },
  })
}

/**
 * Verifica se um número específico já está bloqueado
 */
export async function verificarNumeroBloqueado(
  modalidade: string,
  premio: number,
  numero: string,
  loteria: string | null,
  horario: string | null
): Promise<{ bloqueado: boolean; dados?: any }> {
  const bloqueado = await prisma.numeroBloqueado.findUnique({
    where: {
      modalidade_premio_numero_loteria_horario: {
        modalidade,
        premio,
        numero,
        loteria: loteria || '',
        horario: horario || '',
      },
    },
  })

  return {
    bloqueado: !!bloqueado,
    dados: bloqueado || undefined,
  }
}

/**
 * Bloqueia automaticamente um número quando atinge o limite
 */
export async function bloquearNumero(
  modalidade: string,
  premio: number,
  numero: string,
  loteria: string | null,
  horario: string | null,
  valorAtual: number,
  limite: number
): Promise<void> {
  await prisma.numeroBloqueado.upsert({
    where: {
      modalidade_premio_numero_loteria_horario: {
        modalidade,
        premio,
        numero,
        loteria: loteria || '',
        horario: horario || '',
      },
    },
    update: {
      valorAtual,
      limite,
    },
    create: {
      modalidade,
      premio,
      numero,
      loteria: loteria || '',
      horario: horario || '',
      valorAtual,
      limite,
    },
  })
}

/**
 * Verifica se uma aposta excede o limite e bloqueia automaticamente o número se necessário
 * O sistema detecta automaticamente qual número atingiu o limite baseado nas apostas
 */
export async function verificarLimiteDescargaPorNumero(
  modalidade: string,
  premio: number,
  numero: string, // Número apostado (milhar/centena/dezena)
  loteria: string | null, // Loteria/extracao
  horario: string | null, // Horário da extração
  valorAposta: number
): Promise<{ bloqueado: boolean; mensagem?: string; limite?: number; valorAtual?: number }> {
  // 1. Verificar se o número já está bloqueado
  const verificacaoBloqueio = await verificarNumeroBloqueado(modalidade, premio, numero, loteria, horario)
  if (verificacaoBloqueio.bloqueado && verificacaoBloqueio.dados) {
    const bloqueado = verificacaoBloqueio.dados
    const tipoNumero = numero.length === 4 ? 'milhar' : numero.length === 3 ? 'centena' : numero.length === 2 ? 'dezena' : 'número'
    const extracaoInfo = loteria || 'extração'
    const mensagem = `O ${tipoNumero} ${numero} no ${premio}º prêmio da ${extracaoInfo} está bloqueado. Limite atingido: R$ ${bloqueado.limite.toFixed(2)}.`
    
    return {
      bloqueado: true,
      mensagem,
      limite: bloqueado.limite,
      valorAtual: bloqueado.valorAtual,
    }
  }

  // 2. Buscar limite configurado para esta modalidade + prêmio + extração
  // Primeiro tenta buscar limite específico (com loteria), depois geral (sem loteria)
  let limiteConfig = await prisma.limiteDescarga.findFirst({
    where: {
      modalidade,
      premio,
      loteria: loteria || '',
      horario: '', // Sempre vazio, não usamos horário específico
      ativo: true,
    },
  })

  // Se não encontrou limite específico, busca limite geral
  if (!limiteConfig) {
    limiteConfig = await prisma.limiteDescarga.findFirst({
      where: {
        modalidade,
        premio,
        loteria: '',
        horario: '',
        ativo: true,
      },
    })
  }

  // Se não há limite configurado, não bloqueia
  if (!limiteConfig) {
    return { bloqueado: false }
  }

  // 3. Calcular total apostado neste número específico + extração + prêmio
  const valorAtual = await calcularTotalApostadoPorNumeroExtracaoPremio(
    modalidade,
    premio,
    numero,
    loteria,
    horario
  )

  const valorTotalComNovaAposta = valorAtual + valorAposta
  const bloqueado = valorTotalComNovaAposta > limiteConfig.limite

  // 4. Se atingiu o limite, bloquear automaticamente o número
  if (bloqueado) {
    await bloquearNumero(
      modalidade,
      premio,
      numero,
      loteria,
      horario,
      valorTotalComNovaAposta,
      limiteConfig.limite
    )

    const tipoNumero = numero.length === 4 ? 'milhar' : numero.length === 3 ? 'centena' : numero.length === 2 ? 'dezena' : 'número'
    const mensagem = `O ${tipoNumero} ${numero} no ${premio}º prêmio da ${loteria || 'extração'} atingiu o limite de R$ ${limiteConfig.limite.toFixed(2)}. Total apostado: R$ ${valorAtual.toFixed(2)}.`
    
    return {
      bloqueado: true,
      mensagem,
      limite: limiteConfig.limite,
      valorAtual: valorTotalComNovaAposta,
    }
  }

  return { bloqueado: false }
}

/**
 * Verifica se uma aposta excede o limite e cria alerta se necessário
 * (Mantido para compatibilidade com sistema antigo)
 */
export async function verificarLimiteDescarga(
  modalidade: string,
  premio: number,
  valorAposta: number
): Promise<{ excedeu: boolean; alerta?: AlertaDescarga }> {
  // Buscar limite geral (sem loteria/horário específico) para compatibilidade com sistema antigo
  const limite = await prisma.limiteDescarga.findFirst({
    where: {
      modalidade,
      premio,
      loteria: '',
      horario: '',
      ativo: true,
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
 * Busca todas as apostas por modalidade e prêmio para relatório
 * Inclui apostas pendentes, liquidadas e perdidas
 */
export async function buscarApostasPorPremio(
  modalidade: string,
  premio: number
) {
  // Buscar todas as apostas da modalidade (não apenas pendentes)
  // A modalidade pode estar no campo `modalidade` ou no `betData.modalityName`
  const apostas = await prisma.aposta.findMany({
    where: {
      OR: [
        { modalidade }, // Buscar por modalidade direta
        { modalidade: { contains: modalidade } }, // Buscar por substring (caso haja variações)
      ],
    },
    select: {
      id: true,
      valor: true,
      detalhes: true,
      dataConcurso: true,
      horario: true,
      loteria: true,
      status: true,
      modalidade: true,
      createdAt: true,
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
  })

  console.log(`🔍 Buscando apostas para modalidade "${modalidade}" e prêmio ${premio}`)
  console.log(`   Total de apostas encontradas: ${apostas.length}`)

  const apostasFiltradas = []

  for (const aposta of apostas) {
    const detalhes = aposta.detalhes as any
    if (!detalhes?.betData) {
      // Se não tem betData, tentar usar modalidade direta
      if (aposta.modalidade && aposta.modalidade.toLowerCase() === modalidade.toLowerCase()) {
        // Para apostas antigas sem betData, incluir todas que correspondem à modalidade
        // Mas não podemos verificar o prêmio sem betData, então pulamos
        continue
      }
      continue
    }

    // Verificar se a modalidade corresponde
    const betData = detalhes.betData
    const modalityName = betData.modalityName || aposta.modalidade || ''
    
    // Comparação flexível de modalidade
    const modalidadeCorresponde = 
      modalityName.toLowerCase() === modalidade.toLowerCase() ||
      modalityName.toLowerCase().includes(modalidade.toLowerCase()) ||
      modalidade.toLowerCase().includes(modalityName.toLowerCase())

    if (!modalidadeCorresponde) {
      continue
    }

    // Usar posição personalizada se disponível, senão usar posição padrão
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
        // Converter grupos de animais para nomes ou números
        const grupos = betData.animalBets.map((grupo: number[]) => {
          if (Array.isArray(grupo) && grupo.length > 0) {
            // Se são números (IDs de animais), tentar converter
            return grupo.join(', ')
          }
          return grupo.join(' ')
        })
        palpite = grupos.join(' | ')
      }

      apostasFiltradas.push({
        id: aposta.id,
        valor: aposta.valor,
        palpite,
        data: aposta.dataConcurso || aposta.createdAt,
        horario: aposta.horario,
        loteria: aposta.loteria,
        status: aposta.status,
        usuario: aposta.Usuario,
        posicao: positionToUse,
        modalidade: modalityName || aposta.modalidade,
      })
    }
  }

  console.log(`✅ Apostas filtradas para "${modalidade}" prêmio ${premio}: ${apostasFiltradas.length}`)

  return apostasFiltradas
}

/**
 * Calcula o total apostado por número específico + extração + prêmio
 */
export async function calcularTotalApostadoPorNumeroExtracaoPremio(
  modalidade: string,
  premio: number,
  numero: string | null,
  loteria: string | null,
  horario: string | null
): Promise<number> {
  // Buscar todas as apostas pendentes da modalidade
  const apostas = await prisma.aposta.findMany({
    where: {
      modalidade,
      status: 'pendente',
      loteria: loteria || undefined,
      horario: horario || undefined,
    },
    select: {
      valor: true,
      detalhes: true,
      loteria: true,
      horario: true,
    },
  })

  let total = 0

  for (const aposta of apostas) {
    // Verificar se loteria e horário correspondem
    if (loteria && aposta.loteria !== loteria) continue
    if (horario && aposta.horario !== horario) continue

    const detalhes = aposta.detalhes as any
    if (!detalhes?.betData) continue

    const betData = detalhes.betData

    // Verificar se é modalidade numérica e se o número corresponde
    if (numero && betData.numberBets && betData.numberBets.length > 0) {
      // Normalizar número apostado (remover formatação)
      const numeroLimpo = numero.replace(/\D/g, '')
      const numeroApostadoLimpo = betData.numberBets[0]?.replace(/\D/g, '') || ''
      
      // Verificar se corresponde (pode ser milhar, centena ou dezena)
      let corresponde = false
      
      if (numeroLimpo.length === 4 && numeroApostadoLimpo.length === 4) {
        // Milhar: comparação exata
        corresponde = numeroLimpo === numeroApostadoLimpo
      } else if (numeroLimpo.length === 3 && numeroApostadoLimpo.length >= 3) {
        // Centena: últimos 3 dígitos
        corresponde = numeroLimpo === numeroApostadoLimpo.slice(-3)
      } else if (numeroLimpo.length === 2 && numeroApostadoLimpo.length >= 2) {
        // Dezena: últimos 2 dígitos
        corresponde = numeroLimpo === numeroApostadoLimpo.slice(-2)
      }
      
      if (!corresponde) continue
    } else if (numero) {
      // Se há número especificado mas a aposta não tem numberBets, não conta
      continue
    }

    // Verificar se a posição inclui o prêmio solicitado
    const positionToUse = betData.customPosition && betData.customPositionValue 
      ? betData.customPositionValue.trim() 
      : betData.position

    if (!positionToUse) continue

    let incluiPremio = false
    const cleanedPos = positionToUse.replace(/º/g, '').replace(/\s/g, '')

    if (cleanedPos === '1st' || cleanedPos === '1') {
      incluiPremio = premio === 1
    } else if (cleanedPos.includes('-')) {
      const [from, to] = cleanedPos.split('-').map(Number)
      if (!isNaN(from) && !isNaN(to)) {
        incluiPremio = premio >= from && premio <= to
      }
    } else {
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
