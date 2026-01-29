'use client'

import { useEffect } from 'react'
import { useConfiguracoes } from '@/hooks/useConfiguracoes'

export default function DynamicTitle() {
  const { configuracoes } = useConfiguracoes()

  useEffect(() => {
    if (configuracoes.nomePlataforma) {
      // Usar apenas o nome da plataforma, sem sufixos adicionais
      document.title = configuracoes.nomePlataforma
    } else {
      // Fallback caso não tenha nome configurado
      document.title = 'Poste no Bicho'
    }
  }, [configuracoes.nomePlataforma])

  return null
}
