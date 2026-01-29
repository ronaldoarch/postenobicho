'use client'

import { useEffect } from 'react'
import { useConfiguracoes } from '@/hooks/useConfiguracoes'

export default function DynamicFavicon() {
  const { configuracoes } = useConfiguracoes()

  useEffect(() => {
    // Remover favicons antigos
    const existingFavicons = document.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]')
    existingFavicons.forEach((link) => link.remove())

    if (configuracoes.logoSite) {
      // Detectar tipo de imagem baseado na extensão
      const logoUrl = configuracoes.logoSite.toLowerCase()
      let imageType = 'image/png'
      if (logoUrl.includes('.svg')) {
        imageType = 'image/svg+xml'
      } else if (logoUrl.includes('.jpg') || logoUrl.includes('.jpeg')) {
        imageType = 'image/jpeg'
      } else if (logoUrl.includes('.gif')) {
        imageType = 'image/gif'
      } else if (logoUrl.includes('.webp')) {
        imageType = 'image/webp'
      }

      // Criar favicon com a logo
      const link = document.createElement('link')
      link.rel = 'icon'
      link.type = imageType
      link.href = configuracoes.logoSite
      document.head.appendChild(link)

      // Adicionar também como apple-touch-icon para melhor suporte mobile
      const appleLink = document.createElement('link')
      appleLink.rel = 'apple-touch-icon'
      appleLink.href = configuracoes.logoSite
      document.head.appendChild(appleLink)
    } else {
      // Fallback: usar emoji de leão como favicon (convertido para data URI)
      const link = document.createElement('link')
      link.rel = 'icon'
      link.type = 'image/svg+xml'
      link.href = 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🦁</text></svg>'
      document.head.appendChild(link)
    }
  }, [configuracoes.logoSite])

  return null
}
