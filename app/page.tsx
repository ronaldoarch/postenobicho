'use client'

import { useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Header from '@/components/Header'
import HeroBanner from '@/components/HeroBanner'
import StoriesSection from '@/components/StoriesSection'
import LiveQuotation from '@/components/LiveQuotation'
import ResultsSection from '@/components/ResultsSection'
import VipBanner from '@/components/VipBanner'
import FAQSection from '@/components/FAQSection'
import Footer from '@/components/Footer'
import BottomNav from '@/components/BottomNav'
import { useConfiguracoes } from '@/hooks/useConfiguracoes'

function LogoutHandler() {
  const searchParams = useSearchParams()
  
  // Limpar cookies se vier de logout
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const logoutParam = searchParams.get('logout')
    if (logoutParam) {
      try {
        // Limpar todos os cookies possíveis
        const domain = window.location.hostname
        const cookiesToClear = [
          'lotbicho_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax',
          'lotbicho_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax; Secure',
          `lotbicho_session=; path=/; domain=${domain}; expires=Thu, 01 Jan 1970 00:00:00 GMT`,
          `lotbicho_session=; path=/; domain=.${domain}; expires=Thu, 01 Jan 1970 00:00:00 GMT`,
        ]
        
        cookiesToClear.forEach(cookie => {
          document.cookie = cookie
        })
        
        // Limpar URL sem recarregar
        window.history.replaceState({}, '', '/')
        
        // Forçar reload para limpar estado após um pequeno delay
        setTimeout(() => {
          window.location.reload()
        }, 200)
      } catch (error) {
        console.error('Erro ao limpar cookies:', error)
        // Mesmo com erro, redirecionar
        window.location.href = '/'
      }
    }
  }, [searchParams])
  
  return null
}

export default function Home() {
  const { configuracoes } = useConfiguracoes()
  
  return (
    <div className="flex min-h-screen flex-col bg-gray-scale-100">
      <Suspense fallback={null}>
        <LogoutHandler />
      </Suspense>
      <Header />
      <main className="relative flex flex-1 flex-col overflow-auto bg-gray-scale-100 text-[#1C1C1C]">
        <h1 className="sr-only">Jogo do Bicho</h1>
        <div className="mx-auto flex w-full max-w-[1286px] flex-col gap-4 pt-4 md:gap-6 md:pt-6 lg:gap-8 lg:pt-8 xl:py-6">
          {/* Banner Principal */}
          <div className="w-full overflow-visible xl:rounded-xl">
            <HeroBanner />
          </div>

          {/* Seção Stories */}
          <StoriesSection />

          {/* Cotação ao Vivo */}
          <LiveQuotation />

          {/* Seção Resultados */}
          <ResultsSection />

          {/* Banner VIP */}
          <VipBanner />

          {/* FAQ */}
          <FAQSection />

          {/* Informações sobre o Jogo */}
          <section className="flex flex-col gap-10 p-8">
            <div className="flex w-full justify-center gap-4 lg:justify-between">
            <div className="flex items-center gap-3">
              {configuracoes.logoSite ? (
                <img
                  src={configuracoes.logoSite}
                  alt={configuracoes.nomePlataforma}
                  className="h-12 w-auto lg:h-16"
                />
              ) : (
                <span className="text-4xl">🦁</span>
              )}
              <span className="text-3xl font-bold text-gray-950 lg:text-4xl">{configuracoes.nomePlataforma}</span>
            </div>
              <div className="hidden items-center gap-8 lg:flex">
                <a href="/suporte">
                  <button className="flex min-h-[48px] shrink-0 cursor-pointer touch-manipulation flex-nowrap items-center justify-center gap-2 rounded-xl border border-blue-scale-100 bg-transparent px-5 py-2 text-base font-semibold text-black transition-colors duration-75 hover:border-yellow hover:bg-blue-scale-2-10 hover:text-yellow focus:border-blue-scale-100 focus:text-blue-scale-100 active:bg-blue-scale-2-10 disabled:cursor-default disabled:opacity-80">
                    <span className="iconify i-fluent:chat-12-filled" style={{ fontSize: '24px' }}></span>
                    FALE CONOSCO
                  </button>
                </a>
                <button className="flex min-h-[48px] shrink-0 cursor-pointer touch-manipulation flex-nowrap items-center justify-center gap-2 rounded-xl border border-blue-scale-100 bg-transparent px-5 py-2 text-base font-semibold text-black transition-colors duration-75 hover:border-yellow hover:bg-blue-scale-2-10 hover:text-yellow focus:border-blue-scale-100 focus:text-blue-scale-100 active:bg-blue-scale-2-10 disabled:cursor-default disabled:opacity-80">
                  <span className="iconify i-fluent:question-circle-32-filled" style={{ fontSize: '24px' }}></span>
                  COMO JOGAR
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2 text-sm font-light lg:text-left">
              <h3 className="text-lg font-semibold">Jogo do Bicho</h3>
              <p className="block">
                Jogo do Bicho é uma popular forma de jogo no Brasil, onde os jogadores escolhem um número associado a um
                animal e fazem suas apostas. O &quot;bicho deu&quot; refere-se ao resultado do jogo, que é anunciado
                diariamente em diversos &quot;deu no poste&quot; espalhados pelo país. O Jogo do Bicho é um tipo de jogo em
                que os jogadores escolhem um número de animal e apostam uma determinada quantia de dinheiro. O valor das
                apostas varia e os resultados são determinados com base em sorteios realizados em locais específicos. Com a
                popularidade dos jogos na internet, agora é possível jogar Jogo do Bicho online. No entanto, é importante
                estar ciente dos riscos envolvidos na realização de apostas online e ter a certeza de que o site escolhido é
                seguro e confiável antes de começar a jogar.
              </p>
              <h3 className="mt-6 text-lg font-semibold">Bicho Online</h3>
              <p className="block">
                Existem muitos jogos diferentes disponíveis na internet, incluindo o Jogo do Bicho, mas é importante escolher
                o tipo certo de jogo e compreender as regras antes de começar a jogar. Além disso, é importante verificar os
                resultados dos jogos regularmente para saber se você ganhou ou não. Em geral, o Jogo do Bicho é uma forma
                popular de entretenimento no Brasil e, se jogado com cautela, pode ser divertido e emocionante. No entanto, é
                importante lembrar sempre que jogar com moderação e fazer suas apostas com responsabilidade.
              </p>
            </div>
          </section>
        </div>
      </main>
      <Footer />
      <BottomNav />
    </div>
  )
}
