'use client'

import { useState, useEffect } from 'react'
import { useModalidades } from '@/hooks/useModalidades'
import { MODALITIES } from '@/data/modalities'
import SpecialQuotationsModal from './SpecialQuotationsModal'

interface CotacaoEspecial {
  id: number
  value?: string
  modalidadeId?: number
  isSpecial: boolean
  modalidade?: { id: number; name: string }
}

export default function QuotationGrid() {
  const [showSpecialModal, setShowSpecialModal] = useState(false)
  const [cotacoesEspeciais, setCotacoesEspeciais] = useState<CotacaoEspecial[]>([])
  const { modalidades, loading } = useModalidades()

  useEffect(() => {
    loadCotacoesEspeciais()
  }, [])

  const loadCotacoesEspeciais = async () => {
    try {
      const response = await fetch(`/api/cotacoes/especiais?t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
      })
      const data = await response.json()
      setCotacoesEspeciais(data.cotacoes || [])
    } catch (error) {
      console.error('Erro ao carregar cotações especiais:', error)
    }
  }

  // Usar modalidades do banco ou fallback estático
  const modalidadesParaExibir = modalidades.length > 0 ? modalidades : MODALITIES

  // Função para verificar se modalidade tem cotação especial
  const hasSpecialQuotation = (modalidadeId: number, modalidadeName: string) => {
    return cotacoesEspeciais.some((c) => {
      if (c.modalidadeId === modalidadeId) return true
      // Fallback por nome
      const cotacaoModalidade = modalidadesParaExibir.find((m) => m.id === c.modalidadeId)
      return cotacaoModalidade?.name === modalidadeName
    })
  }

  // Função para obter cotação especial
  const getSpecialQuotation = (modalidadeId: number, modalidadeName: string) => {
    return cotacoesEspeciais.find((c) => {
      if (c.modalidadeId === modalidadeId) return true
      const cotacaoModalidade = modalidadesParaExibir.find((m) => m.id === c.modalidadeId)
      return cotacaoModalidade?.name === modalidadeName
    })
  }

  if (loading) {
    return (
      <div className="text-center py-8 text-gray-500">Carregando cotações...</div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {modalidadesParaExibir.map((quotation) => {
          const isSpecial = hasSpecialQuotation(quotation.id, quotation.name)
          const specialQuot = isSpecial
            ? getSpecialQuotation(quotation.id, quotation.name)
            : null

          return (
            <div
              key={quotation.id}
              className="flex flex-col rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold text-gray-950">{quotation.name}</h3>
                {isSpecial && (
                  <span className="text-red-600 font-bold text-xl" title="Cotação Especial">
                    🔥
                  </span>
                )}
              </div>
              <p className="mb-4 text-2xl font-extrabold text-blue">
                {specialQuot?.value || quotation.value}
              </p>

              {quotation.hasLink && (
                <button
                  onClick={() => setShowSpecialModal(true)}
                  className="mb-3 flex items-center gap-1 text-sm text-blue underline hover:text-blue-scale-70 transition-colors"
                >
                  Ver cotações
                  <span className="iconify i-material-symbols:arrow-drop-down text-lg"></span>
                </button>
              )}

              <a
                href={`/apostar?modalidade=${quotation.id}&modalidadeName=${encodeURIComponent(quotation.name)}${specialQuot ? `&cotacaoEspecial=${specialQuot.id}` : ''}`}
                className="mt-auto rounded-lg bg-blue px-4 py-2 font-semibold text-white hover:bg-blue-scale-70 transition-colors text-center"
              >
                JOGAR
              </a>
            </div>
          )
        })}
      </div>

      <SpecialQuotationsModal
        isOpen={showSpecialModal}
        onClose={() => setShowSpecialModal(false)}
      />
    </>
  )
}
