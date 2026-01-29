'use client'

import { useEffect, useState } from 'react'
import { MODALITIES as DEFAULT_MODALITIES } from '@/data/modalities'
import { Modality } from '@/types/bet'

interface ModalitySelectionProps {
  selectedModality: string | null
  onModalitySelect: (modalityId: string, modalityName: string) => void
}

export default function ModalitySelection({
  selectedModality,
  onModalitySelect,
}: ModalitySelectionProps) {
  const [modalidades, setModalidades] = useState<Modality[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadModalidades()
    
    // Recarrega quando a janela ganha foco (útil após editar no admin)
    const handleFocus = () => {
      loadModalidades()
    }
    window.addEventListener('focus', handleFocus)
    
    return () => {
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  const loadModalidades = async () => {
    try {
      // Adiciona timestamp para evitar cache
      const response = await fetch(`/api/modalidades?t=${Date.now()}`, { 
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
      })
      const data = await response.json()
      if (data.modalidades && data.modalidades.length > 0) {
        // Filtra apenas modalidades ativas antes de setar no estado
        const activeModalidades = data.modalidades.filter((m: Modality) => m.active !== false)
        setModalidades(activeModalidades)
        
        // Se a modalidade selecionada foi desativada, limpa a seleção
        if (selectedModality) {
          const selectedMod = activeModalidades.find(
            (m: Modality) => m.id.toString() === selectedModality
          )
          if (!selectedMod) {
            onModalitySelect('', '') // Limpa a seleção
          }
        }
      }
    } catch (error) {
      console.error('Erro ao carregar modalidades:', error)
      // Mantém os dados padrão em caso de erro
    } finally {
      setLoading(false)
    }
  }
  return (
    <div>
      {/* Header with title */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-950">Modalidade:</h2>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-600">Carregando modalidades...</div>
      ) : (
        <>
          {/* Modalities Grid - 2 columns fixed */}
          <div className="mb-6 grid grid-cols-1 gap-2 md:grid-cols-2">
            {modalidades.length === 0 ? (
              <div className="col-span-2 text-center py-8 text-gray-500">
                Nenhuma modalidade disponível no momento.
              </div>
            ) : (
              modalidades.map((modality) => {
                const isSelected = selectedModality === modality.id.toString()
                return (
                  <button
                    key={modality.id}
                    onClick={() => onModalitySelect(modality.id.toString(), modality.name)}
                    className={`flex min-h-[72px] flex-row items-center justify-between rounded-xl border-2 py-3 px-4 text-left transition-all ${
                      isSelected
                        ? 'border-blue bg-blue/5'
                        : 'border-gray-200 bg-white hover:border-blue/30'
                    }`}
                  >
                    <h3 className="text-base font-bold text-blue leading-tight">{modality.name}</h3>
                    <div className="flex items-center gap-1">
                      <div className="inline-flex items-center gap-1 rounded-full border-2 border-blue bg-blue px-3 py-1.5">
                        <span className="text-sm font-bold text-white leading-tight">{modality.value}</span>
                      </div>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </>
      )}
    </div>
  )
}
