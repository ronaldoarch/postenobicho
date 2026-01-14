/**
 * Funções para verificar se milhar ou centena está cotada
 */

import { prisma } from './prisma'

/**
 * Verifica se uma milhar está cotada
 */
export async function verificarMilharCotada(milhar: string): Promise<boolean> {
  try {
    const milharFormatada = milhar.padStart(4, '0')
    const cotacao = await prisma.cotacaoEspecial.findFirst({
      where: {
        tipo: 'milhar',
        numero: milharFormatada,
        ativo: true,
      },
    })
    return !!cotacao
  } catch (error) {
    console.error('Erro ao verificar milhar cotada:', error)
    return false
  }
}

/**
 * Verifica se uma centena está cotada
 */
export async function verificarCentenaCotada(centena: string): Promise<boolean> {
  try {
    const centenaFormatada = centena.padStart(3, '0')
    const cotacao = await prisma.cotacaoEspecial.findFirst({
      where: {
        tipo: 'centena',
        numero: centenaFormatada,
        ativo: true,
      },
    })
    return !!cotacao
  } catch (error) {
    console.error('Erro ao verificar centena cotada:', error)
    return false
  }
}

/**
 * Extrai a centena de uma milhar
 */
export function extrairCentena(milhar: string | number): string {
  const milharStr = typeof milhar === 'number' ? milhar.toString().padStart(4, '0') : milhar.padStart(4, '0')
  return milharStr.slice(-3)
}
