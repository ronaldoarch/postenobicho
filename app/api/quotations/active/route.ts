import { NextResponse } from 'next/server'
import { ApiResponse, Quotation } from '@/types/api'
import { MODALITIES } from '@/data/modalities'
import { SPECIAL_QUOTATIONS } from '@/data/modalities'

export const dynamic = 'force-dynamic'

// Mapeia modalidades do nosso sistema para o formato da API
const modalityMap: Record<string, string> = {
  'Grupo': 'grupo',
  'Dupla de Grupo': 'dupla_de_grupo',
  'Terno de Grupo': 'terno_de_grupo',
  'Quadra de Grupo': 'quadra_de_grupo',
  'Quina de Grupo': 'quina_de_grupo',
  'Milhar': 'milhar',
  'Milhar/Centena': 'milhar/centena',
  'Milhar Invertida': 'milhar_invertida',
  'Centena': 'centena',
  'Centena Invertida': 'centena_invertida',
  'Dezena': 'dezena',
  'Dezena Invertida': 'dezena_invertida',
  'Duque de Dezena': 'duque_de_dezena',
  'Terno de Dezena': 'terno_de_dezena',
  'Passe vai': 'passe_vai_12345',
  'Passe vai e vem': 'passe_vai_e_vem_12345',
}

// Extrai valor numérico da string (ex: "1x R$ 18.00" -> "18.00")
function extractValue(value: string): string {
  const match = value.match(/R\$\s*([\d.]+)/)
  return match ? match[1] : '0.00'
}

export async function GET() {
  try {
    const quotations: Quotation[] = []
    let position = 1

    // Adiciona cotações padrões (sem loteria especial)
    MODALITIES.forEach((modality) => {
      if (modality.name === 'Milhar') {
        // Para Milhar, adiciona cotações especiais também
        SPECIAL_QUOTATIONS.forEach((special) => {
          quotations.push({
            id: `special-${special.id}-${modality.id}`,
            modality: modalityMap[modality.name] || 'milhar',
            position: position++,
            quotation: extractValue(special.value),
            subQuotations: null,
            catalogLotteryId: `lottery-${special.id}`,
            active: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            deletedAt: null,
            catalogLottery: {
              name: special.name,
            },
          })
        })
      }

      // Cotações padrão
      quotations.push({
        id: `standard-${modality.id}`,
        modality: modalityMap[modality.name] || modality.name.toLowerCase().replace(/\s+/g, '_'),
        position: position++,
        quotation: extractValue(modality.value),
        subQuotations:
          modality.name === 'Milhar/Centena'
            ? { milhar: 3000, centena: 300 }
            : null,
        catalogLotteryId: null,
        active: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null,
        catalogLottery: null,
      })
    })

    const response: ApiResponse<Quotation[]> = {
      type: 'success',
      data: quotations,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching quotations:', error)
    const response: ApiResponse<null> = {
      type: 'error',
      message: 'Erro ao buscar cotações',
    }
    return NextResponse.json(response, { status: 500 })
  }
}
