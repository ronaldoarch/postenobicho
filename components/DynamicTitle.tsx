'use client'

import { useEffect } from 'react'
import { useConfiguracoes } from '@/hooks/useConfiguracoes'

export default function DynamicTitle() {
  const { configuracoes } = useConfiguracoes()

  useEffect(() => {
    if (configuracoes.nomePlataforma) {
      document.title = `${configuracoes.nomePlataforma} - Acerte no Jogo do Bicho e Ganhe!`
    }
  }, [configuracoes.nomePlataforma])

  return null
}
