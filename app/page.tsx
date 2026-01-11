import Header from '@/components/Header'
import HeroBanner from '@/components/HeroBanner'
import StoriesSection from '@/components/StoriesSection'
import LiveQuotation from '@/components/LiveQuotation'
import JackpotSection from '@/components/JackpotSection'
import VipBanner from '@/components/VipBanner'
import FAQSection from '@/components/FAQSection'
import Footer from '@/components/Footer'
import BottomNav from '@/components/BottomNav'

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-scale-100">
      <Header />
      <main className="relative flex flex-1 flex-col overflow-auto bg-gray-scale-100 text-[#1C1C1C]">
        <h1 className="sr-only">Jogo do Bicho</h1>
        <div className="mx-auto flex w-full max-w-[1286px] flex-col gap-4 pt-4 md:gap-6 md:pt-6 lg:gap-8 lg:pt-8 xl:py-6">
          {/* Banner Principal */}
          <div className="w-full overflow-hidden xl:rounded-xl">
            <HeroBanner />
          </div>

          {/* Seção Stories */}
          <StoriesSection />

          {/* Cotação ao Vivo */}
          <LiveQuotation />

          {/* Seção Jackpot */}
          <JackpotSection />

          {/* Banner VIP */}
          <VipBanner />

          {/* FAQ */}
          <FAQSection />

          {/* Informações sobre o Jogo */}
          <section className="flex flex-col gap-10 p-8">
            <div className="flex w-full justify-center gap-4 lg:justify-between">
              <img
                src="https://ponto-do-bicho.b-cdn.net/logos/logo_escura.webp"
                alt="Logo"
                className="aspect-[361/70] h-auto w-auto"
              />
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
