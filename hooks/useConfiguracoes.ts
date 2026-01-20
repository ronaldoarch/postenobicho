'use client'

import { useEffect, useState } from 'react'

interface Configuracoes {
  nomePlataforma: string
  numeroSuporte: string
  emailSuporte: string
  whatsappSuporte: string
  logoSite: string
  liquidacaoAutomatica?: boolean
}

export function useConfiguracoes() {
  // Usar valor do window se disponível (carregado pelo script no servidor)
  const nomePlataformaInicial = typeof window !== 'undefined' && (window as any).__NOME_PLATAFORMA__ 
    ? (window as any).__NOME_PLATAFORMA__ 
    : 'Poste no Bicho'
  
  const [configuracoes, setConfiguracoes] = useState<Configuracoes>({
    nomePlataforma: nomePlataformaInicial,
    numeroSuporte: '(00) 00000-0000',
    emailSuporte: 'suporte@postenobicho.com',
    whatsappSuporte: '5500000000000',
    logoSite: '',
    liquidacaoAutomatica: true,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadConfiguracoes()
    
    const handleFocus = () => {
      loadConfiguracoes()
    }
    window.addEventListener('focus', handleFocus)
    
    return () => {
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  const loadConfiguracoes = async () => {
    try {
      const response = await fetch(`/api/configuracoes?t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
      })
      const data = await response.json()
      if (data.configuracoes) {
        setConfiguracoes(data.configuracoes)
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error)
    } finally {
      setLoading(false)
    }
  }

  return { configuracoes, loading }
}
