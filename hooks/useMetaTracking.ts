'use client'

import { MetaEvents } from '@/components/MetaPixel'

export function useMetaTracking() {
  return {
    // Eventos de conversão
    trackRegistration: () => {
      MetaEvents.completeRegistration({
        content_name: 'Cadastro Realizado',
        value: 0,
        currency: 'BRL',
      })
    },
    
    trackBet: (value: number, modality?: string) => {
      MetaEvents.betPlaced({
        bet_value: value,
        modality,
        currency: 'BRL',
      })
      // Também rastrear como InitiateCheckout
      MetaEvents.initiateCheckout({
        content_name: `Aposta - ${modality || 'Jogo do Bicho'}`,
        value,
        currency: 'BRL',
      })
    },
    
    trackDeposit: (value: number, paymentMethod?: string) => {
      MetaEvents.deposit({
        deposit_value: value,
        currency: 'BRL',
        payment_method: paymentMethod,
      })
      // Também rastrear como AddPaymentInfo
      MetaEvents.addPaymentInfo({
        content_name: 'Depósito',
        value,
        currency: 'BRL',
      })
    },
    
    trackWithdrawal: (value: number) => {
      MetaEvents.withdrawal({
        withdrawal_value: value,
        currency: 'BRL',
      })
    },
    
    trackViewContent: (contentName: string, category?: string) => {
      MetaEvents.viewContent({
        content_name: contentName,
        content_category: category,
      })
    },
    
    trackSearch: (searchTerm: string) => {
      MetaEvents.search({
        search_string: searchTerm,
      })
    },
  }
}
