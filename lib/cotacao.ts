/**
 * Funções para verificar se milhar ou centena está cotada
 */

import { prisma } from './prisma'

/**
 * Verifica se uma milhar está cotada e retorna a cotação
 */
export async function verificarMilharCotada(milhar: string | number): Promise<{ cotada: boolean; cotacao: number | null }> {
  try {
    const milharStr = typeof milhar === 'number' ? milhar.toString().padStart(4, '0') : milhar.padStart(4, '0')
    const milharFormatada = milharStr.slice(-4)
    const cotacao = await prisma.cotacaoEspecial.findFirst({
      where: {
        tipo: 'milhar',
        numero: milharFormatada,
        ativo: true,
      },
    })
    return {
      cotada: !!cotacao,
      cotacao: cotacao?.cotacao ?? null,
    }
  } catch (error) {
    console.error('Erro ao verificar milhar cotada:', error)
    return { cotada: false, cotacao: null }
  }
}

/**
 * Verifica se uma centena está cotada e retorna a cotação
 */
export async function verificarCentenaCotada(centena: string | number): Promise<{ cotada: boolean; cotacao: number | null }> {
  try {
    const centenaStr = typeof centena === 'number' ? centena.toString().padStart(3, '0') : centena.padStart(3, '0')
    const centenaFormatada = centenaStr.slice(-3)
    const cotacao = await prisma.cotacaoEspecial.findFirst({
      where: {
        tipo: 'centena',
        numero: centenaFormatada,
        ativo: true,
      },
    })
    return {
      cotada: !!cotacao,
      cotacao: cotacao?.cotacao ?? null,
    }
  } catch (error) {
    console.error('Erro ao verificar centena cotada:', error)
    return { cotada: false, cotacao: null }
  }
}

/**
 * Extrai a centena de uma milhar
 */
export function extrairCentena(milhar: string | number): string {
  const milharStr = typeof milhar === 'number' ? milhar.toString().padStart(4, '0') : milhar.padStart(4, '0')
  return milharStr.slice(-3)
}
