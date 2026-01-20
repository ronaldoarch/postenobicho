import { useState, useEffect } from 'react'
import { Modality } from '@/types/bet'
import { MODALITIES } from '@/data/modalities'

export function useModalidades() {
  const [modalidades, setModalidades] = useState<Modality[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadModalidades()
  }, [])

  const loadModalidades = async () => {
    try {
      const response = await fetch(`/api/modalidades?t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
      })
      const data = await response.json()
      
      if (data.modalidades && data.modalidades.length > 0) {
        // Filtra apenas modalidades ativas
        const activeModalidades = data.modalidades.filter(
          (m: Modality) => m.active !== false
        )
        setModalidades(activeModalidades)
      } else {
        // Fallback para dados estáticos
        setModalidades(MODALITIES)
      }
    } catch (error) {
      console.error('Erro ao carregar modalidades:', error)
      // Fallback para dados estáticos em caso de erro
      setModalidades(MODALITIES)
    } finally {
      setLoading(false)
    }
  }

  return { modalidades, loading, reload: loadModalidades }
}
