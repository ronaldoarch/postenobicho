'use client'

import { useState, useEffect } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Autoplay } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'

interface Cotacao {
  id: number
  name?: string
  value?: string
  modalidade?: { id: number; name: string }
}

// Fallback caso não encontre cotações no banco
const QUOTATIONS_FALLBACK = [
  { title: '5. Quina de Grupo', payout: '1x R$ 5.000,00' },
  { title: '9. Milhar/Centena', payout: '1x R$ 3.300,00' },
  { title: '12. Milhar Invertida', payout: '1x R$ 6.000,00' },
  { title: '8. Milhar', payout: '1x R$ 6.000,00' },
  { title: '14. Terno de Dezena', payout: '1x R$ 5.000,00' },
  { title: '4. Quadra de Grupo', payout: '1x R$ 1.000,00' },
]

export default function LiveQuotation() {
  const [quotations, setQuotations] = useState<Array<{ title: string; payout: string }>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadQuotations()
  }, [])

  const loadQuotations = async () => {
    try {
      // Buscar modalidades do banco (que têm as cotações atualizadas)
      const modalidadesResponse = await fetch('/api/modalidades?t=' + Date.now(), {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
      })
      const modalidadesData = await modalidadesResponse.json()

      // Buscar cotações especiais também
      const cotacoesResponse = await fetch('/api/cotacoes/especiais?limit=6')
      const cotacoesData = await cotacoesResponse.json()

      let quotationsToShow: Array<{ title: string; payout: string }> = []

      // Priorizar cotações especiais se existirem
      if (cotacoesData.cotacoes && cotacoesData.cotacoes.length > 0) {
        quotationsToShow = cotacoesData.cotacoes.map((cotacao: Cotacao) => {
          const modalidadeName = cotacao.modalidade?.name || cotacao.name || 'Modalidade'
          return {
            title: modalidadeName,
            payout: cotacao.value || '1x R$ 0,00',
          }
        })
      }

      // Se não houver cotações especiais suficientes, completar com modalidades padrão
      if (quotationsToShow.length < 6 && modalidadesData.modalidades) {
        const modalidadesAtivas = modalidadesData.modalidades
          .filter((m: any) => m.active !== false)
          .slice(0, 6 - quotationsToShow.length)
        
        modalidadesAtivas.forEach((modalidade: any) => {
          // Verificar se já não está na lista (para evitar duplicatas)
          if (!quotationsToShow.some(q => q.title === modalidade.name)) {
            quotationsToShow.push({
              title: modalidade.name,
              payout: modalidade.value || '1x R$ 0,00',
            })
          }
        })
      }

      // Se ainda não houver cotações suficientes, usar fallback
      if (quotationsToShow.length === 0) {
        setQuotations(QUOTATIONS_FALLBACK)
      } else {
        setQuotations(quotationsToShow.slice(0, 6))
      }
    } catch (error) {
      console.error('Erro ao carregar cotações:', error)
      // Usar fallback em caso de erro
      setQuotations(QUOTATIONS_FALLBACK)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <section className="w-full rounded-xl bg-white p-4 md:p-6 lg:p-8">
        <div className="text-center py-8 text-gray-500">Carregando cotações...</div>
      </section>
    )
  }

  return (
    <section className="w-full rounded-xl bg-white p-4 md:p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between gap-1">
        <div className="flex items-center gap-1">
          <span className="iconify i-fluent:live-24-regular text-gray-scale-700 text-2xl lg:text-3xl"></span>
          <h2 className="text-lg font-bold uppercase leading-none text-gray-scale-700 md:text-xl lg:text-2xl">
            COTAÇÃO AO VIVO
          </h2>
        </div>
        <a href="/jogo-do-bicho/cotacao" className="flex min-w-[84px] items-center gap-2 text-base text-blue underline">
          Ver todos
        </a>
      </div>

      <Swiper
        modules={[Navigation, Autoplay]}
        spaceBetween={16}
        slidesPerView="auto"
        navigation
        autoplay={{ delay: 2500, disableOnInteraction: false }}
        className="w-full"
        loop
      >
        {quotations.map((q, index) => (
          <SwiperSlide key={`${q.title}-${index}`} className="!w-[240px] md:!w-[260px]">
            <div className="flex h-full flex-col items-center justify-between rounded-2xl bg-gradient-to-br from-blue via-blue-scale-70 to-blue-scale-100 px-4 py-6 shadow-lg border border-yellow/30">
              <p className="mb-4 text-center text-lg font-bold text-white">{q.title}</p>
              <p className="mb-4 text-center text-xl font-extrabold text-yellow">{q.payout}</p>
              <a
                href="/jogo-do-bicho/cotacao"
                className="w-full rounded-lg bg-yellow px-4 py-2 text-center text-base font-bold text-blue-950 hover:bg-yellow/90 transition-colors"
              >
                JOGAR
              </a>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  )
}
