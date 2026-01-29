'use client'

import { useEffect } from 'react'

interface MetaPixelProps {
  pixelId?: string | null
}

export default function MetaPixel({ pixelId }: MetaPixelProps) {
  useEffect(() => {
    if (!pixelId) return

    // Carregar Facebook Pixel
    const script = document.createElement('script')
    script.innerHTML = `
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', '${pixelId}');
      fbq('track', 'PageView');
    `
    script.id = 'facebook-pixel'
    document.head.appendChild(script)

    // Noscript fallback
    const noscript = document.createElement('noscript')
    noscript.innerHTML = `<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1"/>`
    document.body.appendChild(noscript)

    return () => {
      // Cleanup
      const existingScript = document.getElementById('facebook-pixel')
      if (existingScript) {
        existingScript.remove()
      }
      const existingNoscript = document.querySelector('noscript img[src*="facebook.com/tr"]')
      if (existingNoscript?.parentElement) {
        existingNoscript.parentElement.remove()
      }
    }
  }, [pixelId])

  return null
}

// Funções helper para rastrear eventos
export const trackMetaEvent = (eventName: string, params?: Record<string, any>) => {
  if (typeof window !== 'undefined' && (window as any).fbq) {
    ;(window as any).fbq('track', eventName, params || {})
    
    // Também enviar para Conversions API via nosso endpoint
    fetch('/api/meta/conversion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventName,
        params: params || {},
      }),
    }).catch((err) => {
      console.error('Erro ao enviar evento para Conversions API:', err)
    })
  }
}

// Eventos pré-definidos
export const MetaEvents = {
  // Eventos de engajamento
  pageView: () => {
    if (typeof window !== 'undefined' && (window as any).fbq) {
      ;(window as any).fbq('track', 'PageView')
    }
  },
  
  // Eventos de conversão
  lead: (params?: { content_name?: string; value?: number; currency?: string }) => {
    trackMetaEvent('Lead', params)
  },
  
  completeRegistration: (params?: { content_name?: string; value?: number; currency?: string }) => {
    trackMetaEvent('CompleteRegistration', params)
  },
  
  initiateCheckout: (params?: { content_name?: string; value?: number; currency?: string }) => {
    trackMetaEvent('InitiateCheckout', params)
  },
  
  addPaymentInfo: (params?: { content_name?: string; value?: number; currency?: string }) => {
    trackMetaEvent('AddPaymentInfo', params)
  },
  
  purchase: (params?: { 
    content_name?: string
    value?: number
    currency?: string
    content_ids?: string[]
    num_items?: number
  }) => {
    trackMetaEvent('Purchase', params)
  },
  
  // Eventos customizados
  viewContent: (params?: { content_name?: string; content_category?: string }) => {
    trackMetaEvent('ViewContent', params)
  },
  
  search: (params?: { search_string?: string }) => {
    trackMetaEvent('Search', params)
  },
  
  addToCart: (params?: { content_name?: string; value?: number; currency?: string }) => {
    trackMetaEvent('AddToCart', params)
  },
  
  // Eventos específicos do jogo
  betPlaced: (params?: { 
    bet_value: number
    modality?: string
    currency?: string
  }) => {
    trackMetaEvent('BetPlaced', {
      ...params,
      content_name: 'Aposta Realizada',
      value: params?.bet_value,
      currency: params?.currency || 'BRL',
    })
  },
  
  deposit: (params?: { 
    deposit_value: number
    currency?: string
    payment_method?: string
  }) => {
    trackMetaEvent('Deposit', {
      ...params,
      content_name: 'Depósito Realizado',
      value: params?.deposit_value,
      currency: params?.currency || 'BRL',
    })
  },
  
  withdrawal: (params?: { 
    withdrawal_value: number
    currency?: string
  }) => {
    trackMetaEvent('Withdrawal', {
      ...params,
      content_name: 'Saque Realizado',
      value: params?.withdrawal_value,
      currency: params?.currency || 'BRL',
    })
  },
}
