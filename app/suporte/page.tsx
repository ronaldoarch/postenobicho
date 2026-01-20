'use client'

import Header from '@/components/Header'
import Footer from '@/components/Footer'
import BottomNav from '@/components/BottomNav'
import { useConfiguracoes } from '@/hooks/useConfiguracoes'
import { useState } from 'react'

export default function SuportePage() {
  const { configuracoes } = useConfiguracoes()
  const [activeSection, setActiveSection] = useState<string | null>(null)

  const toggleSection = (section: string) => {
    setActiveSection(activeSection === section ? null : section)
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-scale-100">
      <Header />
      <main className="relative flex flex-1 flex-col overflow-auto bg-gray-scale-100 text-[#1C1C1C]">
        <div className="mx-auto flex w-full max-w-[1286px] flex-col gap-4 pt-4 md:gap-6 md:pt-6 lg:gap-8 lg:pt-8 xl:py-6">
          {/* Sub-header */}
          <div className="flex items-center gap-4 bg-blue/10 px-4 py-3">
            <a href="/" className="flex items-center justify-center rounded-lg p-2 hover:bg-white/20 transition-colors">
              <span className="iconify i-material-symbols:arrow-back text-2xl text-gray-950"></span>
            </a>
            <h1 className="flex-1 text-center text-xl font-bold text-gray-950 md:text-2xl">
              Guia Completo - Como Jogar
            </h1>
          </div>

          {/* Content */}
          <div className="space-y-6">
            {/* Introdução */}
            <section className="rounded-xl bg-gradient-to-r from-blue/10 to-green/10 p-6 md:p-8">
              <div className="flex items-start gap-4">
                <div className="rounded-full bg-blue p-3">
                  <span className="iconify i-material-symbols:info text-3xl text-white"></span>
                </div>
                <div className="flex-1">
                  <h2 className="mb-3 text-2xl font-bold text-gray-scale-900">
                    Bem-vindo ao {configuracoes.nomePlataforma}!
                  </h2>
                  <p className="mb-4 text-gray-scale-700 leading-relaxed">
                    Este guia foi criado para ajudá-lo a entender como funciona nosso sistema de apostas online. 
                    Aqui você encontrará todas as informações necessárias para jogar de forma segura e responsável.
                  </p>
                  <div className="rounded-lg bg-white/50 p-4">
                    <p className="text-sm font-semibold text-gray-scale-800">
                      ⚠️ Importante: Jogue com responsabilidade. Aposte apenas o que você pode perder.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Índice */}
            <section className="rounded-xl bg-white p-6 shadow-md">
              <h2 className="mb-4 text-xl font-bold text-gray-scale-900">📚 Índice do Guia</h2>
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                <button
                  onClick={() => toggleSection('o-que-e')}
                  className="text-left rounded-lg border border-gray-200 p-3 hover:bg-gray-50 transition-colors"
                >
                  <span className="font-semibold text-blue">1. O que é o Jogo do Bicho Online?</span>
                </button>
                <button
                  onClick={() => toggleSection('como-apostar')}
                  className="text-left rounded-lg border border-gray-200 p-3 hover:bg-gray-50 transition-colors"
                >
                  <span className="font-semibold text-blue">2. Como Fazer uma Aposta</span>
                </button>
                <button
                  onClick={() => toggleSection('modalidades')}
                  className="text-left rounded-lg border border-gray-200 p-3 hover:bg-gray-50 transition-colors"
                >
                  <span className="font-semibold text-blue">3. Modalidades de Aposta</span>
                </button>
                <button
                  onClick={() => toggleSection('posicoes')}
                  className="text-left rounded-lg border border-gray-200 p-3 hover:bg-gray-50 transition-colors"
                >
                  <span className="font-semibold text-blue">4. Posições e Prêmios</span>
                </button>
                <button
                  onClick={() => toggleSection('resultados')}
                  className="text-left rounded-lg border border-gray-200 p-3 hover:bg-gray-50 transition-colors"
                >
                  <span className="font-semibold text-blue">5. Como Ver os Resultados</span>
                </button>
                <button
                  onClick={() => toggleSection('depositos-saques')}
                  className="text-left rounded-lg border border-gray-200 p-3 hover:bg-gray-50 transition-colors"
                >
                  <span className="font-semibold text-blue">6. Depósitos e Saques</span>
                </button>
                <button
                  onClick={() => toggleSection('dicas')}
                  className="text-left rounded-lg border border-gray-200 p-3 hover:bg-gray-50 transition-colors"
                >
                  <span className="font-semibold text-blue">7. Dicas e Boas Práticas</span>
                </button>
                <button
                  onClick={() => toggleSection('duvidas')}
                  className="text-left rounded-lg border border-gray-200 p-3 hover:bg-gray-50 transition-colors"
                >
                  <span className="font-semibold text-blue">8. Dúvidas Frequentes</span>
                </button>
              </div>
            </section>

            {/* Seção 1: O que é */}
            {activeSection === 'o-que-e' && (
              <section className="rounded-xl bg-white p-6 shadow-md">
                <div className="mb-4 flex items-center gap-3">
                  <span className="text-2xl">🎯</span>
                  <h2 className="text-2xl font-bold text-gray-scale-900">O que é o Jogo do Bicho Online?</h2>
                </div>
                <div className="space-y-4 text-gray-scale-700">
                  <p>
                    O <strong>Jogo do Bicho Online</strong> é uma plataforma digital que permite realizar apostas 
                    baseadas nos resultados de sorteios oficiais. Cada número sorteado corresponde a um animal, 
                    e você pode apostar em diferentes combinações e modalidades.
                  </p>
                  <div className="rounded-lg bg-blue/5 p-4">
                    <h3 className="mb-2 font-semibold text-gray-scale-900">Como Funciona:</h3>
                    <ul className="list-disc list-inside space-y-2">
                      <li>Os sorteios acontecem em horários específicos do dia</li>
                      <li>Cada número de 4 dígitos (milhar) corresponde a um animal</li>
                      <li>Você pode apostar em animais, números ou combinações</li>
                      <li>Se sua aposta corresponder ao resultado, você ganha!</li>
                    </ul>
                  </div>
                  <div className="rounded-lg bg-green/5 p-4">
                    <h3 className="mb-2 font-semibold text-gray-scale-900">✅ Vantagens do Sistema Online:</h3>
                    <ul className="list-disc list-inside space-y-2">
                      <li>Segurança total dos seus dados</li>
                      <li>Depósitos e saques rápidos via PIX</li>
                      <li>Apostas a qualquer hora do dia</li>
                      <li>Histórico completo das suas apostas</li>
                      <li>Resultados atualizados automaticamente</li>
                    </ul>
                  </div>
                </div>
              </section>
            )}

            {/* Seção 2: Como Apostar */}
            {activeSection === 'como-apostar' && (
              <section className="rounded-xl bg-white p-6 shadow-md">
                <div className="mb-4 flex items-center gap-3">
                  <span className="text-2xl">📝</span>
                  <h2 className="text-2xl font-bold text-gray-scale-900">Como Fazer uma Aposta</h2>
                </div>
                <div className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex items-start gap-4 rounded-lg border border-gray-200 p-4">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue text-white font-bold">
                        1
                      </div>
                      <div>
                        <h3 className="mb-2 font-semibold text-gray-scale-900">Escolha a Modalidade</h3>
                        <p className="text-gray-scale-700">
                          Acesse a página de apostas e selecione o tipo de aposta que deseja fazer. 
                          Você pode escolher entre apostas em <strong>Grupos (animais)</strong> ou 
                          <strong> Números (dezenas, centenas, milhares)</strong>.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4 rounded-lg border border-gray-200 p-4">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue text-white font-bold">
                        2
                      </div>
                      <div>
                        <h3 className="mb-2 font-semibold text-gray-scale-900">Selecione seus Palpites</h3>
                        <p className="text-gray-scale-700">
                          <strong>Para apostas em Grupos:</strong> Escolha os animais que deseja apostar.<br/>
                          <strong>Para apostas em Números:</strong> Digite os números (dezena, centena ou milhar).
                        </p>
                        <p className="mt-2 text-sm text-gray-scale-600">
                          💡 Você pode fazer até 10 palpites por aposta.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4 rounded-lg border border-gray-200 p-4">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue text-white font-bold">
                        3
                      </div>
                      <div>
                        <h3 className="mb-2 font-semibold text-gray-scale-900">Escolha a Posição</h3>
                        <p className="text-gray-scale-700">
                          Selecione em quais prêmios você quer apostar:
                        </p>
                        <ul className="mt-2 list-disc list-inside space-y-1 text-sm text-gray-scale-600">
                          <li><strong>1º Prêmio:</strong> Apenas o primeiro número sorteado</li>
                          <li><strong>1º ao 3º:</strong> Os três primeiros números</li>
                          <li><strong>1º ao 5º:</strong> Os cinco primeiros números</li>
                          <li><strong>1º ao 7º:</strong> Os sete primeiros números (quando disponível)</li>
                        </ul>
                      </div>
                    </div>

                    <div className="flex items-start gap-4 rounded-lg border border-gray-200 p-4">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue text-white font-bold">
                        4
                      </div>
                      <div>
                        <h3 className="mb-2 font-semibold text-gray-scale-900">Defina o Valor</h3>
                        <p className="text-gray-scale-700">
                          Escolha o valor da sua aposta e como deseja dividir:
                        </p>
                        <ul className="mt-2 list-disc list-inside space-y-1 text-sm text-gray-scale-600">
                          <li><strong>Para cada palpite:</strong> O valor será aplicado a cada palpite individualmente</li>
                          <li><strong>Para todos os palpites:</strong> O valor será dividido igualmente entre todos os palpites</li>
                        </ul>
                        <p className="mt-2 text-sm text-gray-scale-600">
                          💡 Valor mínimo: R$ 0,50
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4 rounded-lg border border-gray-200 p-4">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue text-white font-bold">
                        5
                      </div>
                      <div>
                        <h3 className="mb-2 font-semibold text-gray-scale-900">Confirme e Finalize</h3>
                        <p className="text-gray-scale-700">
                          Revise todas as informações da sua aposta e clique em <strong>"Confirmar"</strong>. 
                          Sua aposta será registrada e você poderá acompanhar o resultado no horário do sorteio.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Seção 3: Modalidades */}
            {activeSection === 'modalidades' && (
              <section className="rounded-xl bg-white p-6 shadow-md">
                <div className="mb-4 flex items-center gap-3">
                  <span className="text-2xl">🎲</span>
                  <h2 className="text-2xl font-bold text-gray-scale-900">Modalidades de Aposta</h2>
                </div>
                <div className="space-y-6">
                  <div>
                    <h3 className="mb-3 text-xl font-semibold text-gray-scale-900">📌 Apostas em Grupos (Animais)</h3>
                    <div className="space-y-3">
                      <div className="rounded-lg border border-gray-200 p-4">
                        <h4 className="mb-2 font-semibold text-blue">Grupo</h4>
                        <p className="mb-2 text-sm text-gray-scale-700">
                          Aposte em um único animal. Exemplo: Cachorro (Grupo 05)
                        </p>
                        <p className="text-xs text-gray-scale-600">Prêmio: 18x o valor apostado</p>
                      </div>
                      <div className="rounded-lg border border-gray-200 p-4">
                        <h4 className="mb-2 font-semibold text-blue">Dupla de Grupo</h4>
                        <p className="mb-2 text-sm text-gray-scale-700">
                          Aposte em 2 animais. Exemplo: Cachorro e Gato
                        </p>
                        <p className="text-xs text-gray-scale-600">Prêmio: 180x o valor apostado</p>
                      </div>
                      <div className="rounded-lg border border-gray-200 p-4">
                        <h4 className="mb-2 font-semibold text-blue">Terno de Grupo</h4>
                        <p className="mb-2 text-sm text-gray-scale-700">
                          Aposte em 3 animais. Exemplo: Cachorro, Gato e Leão
                        </p>
                        <p className="text-xs text-gray-scale-600">Prêmio: 1.800x o valor apostado</p>
                      </div>
                      <div className="rounded-lg border border-gray-200 p-4">
                        <h4 className="mb-2 font-semibold text-blue">Quadra de Grupo</h4>
                        <p className="mb-2 text-sm text-gray-scale-700">
                          Aposte em 4 animais. Exemplo: Cachorro, Gato, Leão e Macaco
                        </p>
                        <p className="text-xs text-gray-scale-600">Prêmio: 5.000x o valor apostado</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="mb-3 text-xl font-semibold text-gray-scale-900">🔢 Apostas em Números</h3>
                    <div className="space-y-3">
                      <div className="rounded-lg border border-gray-200 p-4">
                        <h4 className="mb-2 font-semibold text-green">Dezena</h4>
                        <p className="mb-2 text-sm text-gray-scale-700">
                          Aposte nos 2 últimos dígitos. Exemplo: 27
                        </p>
                        <p className="text-xs text-gray-scale-600">Prêmio: 60x o valor apostado</p>
                      </div>
                      <div className="rounded-lg border border-gray-200 p-4">
                        <h4 className="mb-2 font-semibold text-green">Centena</h4>
                        <p className="mb-2 text-sm text-gray-scale-700">
                          Aposte nos 3 últimos dígitos. Exemplo: 384
                        </p>
                        <p className="text-xs text-gray-scale-600">Prêmio: 600x o valor apostado</p>
                      </div>
                      <div className="rounded-lg border border-gray-200 p-4">
                        <h4 className="mb-2 font-semibold text-green">Milhar</h4>
                        <p className="mb-2 text-sm text-gray-scale-700">
                          Aposte nos 4 dígitos completos. Exemplo: 2580
                        </p>
                        <p className="text-xs text-gray-scale-600">Prêmio: 5.000x o valor apostado</p>
                      </div>
                      <div className="rounded-lg border border-gray-200 p-4">
                        <h4 className="mb-2 font-semibold text-green">Milhar Invertida</h4>
                        <p className="mb-2 text-sm text-gray-scale-700">
                          Aposte em todas as combinações possíveis dos 4 dígitos. Exemplo: 2580 gera 24 combinações
                        </p>
                        <p className="text-xs text-gray-scale-600">Prêmio: 200x o valor apostado</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="mb-3 text-xl font-semibold text-gray-scale-900">🔄 Apostas Especiais</h3>
                    <div className="space-y-3">
                      <div className="rounded-lg border border-gray-200 p-4">
                        <h4 className="mb-2 font-semibold text-purple">Passe Vai</h4>
                        <p className="mb-2 text-sm text-gray-scale-700">
                          Aposte que um número aparecerá no 1º e outro no 2º prêmio, na ordem exata.
                        </p>
                        <p className="text-xs text-gray-scale-600">Prêmio: 300x o valor apostado</p>
                      </div>
                      <div className="rounded-lg border border-gray-200 p-4">
                        <h4 className="mb-2 font-semibold text-purple">Passe Vai e Vem</h4>
                        <p className="mb-2 text-sm text-gray-scale-700">
                          Aposte que dois números aparecerão no 1º e 2º prêmio, em qualquer ordem.
                        </p>
                        <p className="text-xs text-gray-scale-600">Prêmio: 150x o valor apostado</p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Seção 4: Posições */}
            {activeSection === 'posicoes' && (
              <section className="rounded-xl bg-white p-6 shadow-md">
                <div className="mb-4 flex items-center gap-3">
                  <span className="text-2xl">🏆</span>
                  <h2 className="text-2xl font-bold text-gray-scale-900">Posições e Prêmios</h2>
                </div>
                <div className="space-y-4">
                  <p className="text-gray-scale-700">
                    Quando você faz uma aposta, pode escolher em quais <strong>posições</strong> (prêmios) 
                    ela será válida. Quanto mais posições você escolher, maior a chance de ganhar, 
                    mas o prêmio pode ser menor.
                  </p>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="rounded-lg border-2 border-blue p-4">
                      <h3 className="mb-2 font-bold text-blue">1º Prêmio</h3>
                      <p className="mb-2 text-sm text-gray-scale-700">
                        Sua aposta só ganha se o resultado aparecer no primeiro número sorteado.
                      </p>
                      <p className="text-xs font-semibold text-gray-scale-600">Maior prêmio, menor chance</p>
                    </div>
                    <div className="rounded-lg border-2 border-green p-4">
                      <h3 className="mb-2 font-bold text-green">1º ao 3º Prêmio</h3>
                      <p className="mb-2 text-sm text-gray-scale-700">
                        Sua aposta ganha se aparecer em qualquer um dos três primeiros números.
                      </p>
                      <p className="text-xs font-semibold text-gray-scale-600">Bom equilíbrio</p>
                    </div>
                    <div className="rounded-lg border-2 border-yellow p-4">
                      <h3 className="mb-2 font-bold text-yellow">1º ao 5º Prêmio</h3>
                      <p className="mb-2 text-sm text-gray-scale-700">
                        Sua aposta ganha se aparecer em qualquer um dos cinco primeiros números.
                      </p>
                      <p className="text-xs font-semibold text-gray-scale-600">Maior chance de ganhar</p>
                    </div>
                    <div className="rounded-lg border-2 border-purple p-4">
                      <h3 className="mb-2 font-bold text-purple">1º ao 7º Prêmio</h3>
                      <p className="mb-2 text-sm text-gray-scale-700">
                        Sua aposta ganha se aparecer em qualquer um dos sete primeiros números.
                      </p>
                      <p className="text-xs font-semibold text-gray-scale-600">Máxima chance (quando disponível)</p>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Seção 5: Resultados */}
            {activeSection === 'resultados' && (
              <section className="rounded-xl bg-white p-6 shadow-md">
                <div className="mb-4 flex items-center gap-3">
                  <span className="text-2xl">📊</span>
                  <h2 className="text-2xl font-bold text-gray-scale-900">Como Ver os Resultados</h2>
                </div>
                <div className="space-y-4 text-gray-scale-700">
                  <p>
                    Os resultados são atualizados automaticamente após cada sorteio. Você pode verificar de várias formas:
                  </p>
                  <div className="space-y-3">
                    <div className="rounded-lg bg-gray-50 p-4">
                      <h3 className="mb-2 font-semibold text-gray-scale-900">1. Página de Resultados</h3>
                      <p className="text-sm">
                        Acesse a seção <strong>"Resultados"</strong> no menu principal para ver todos os sorteios do dia.
                      </p>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-4">
                      <h3 className="mb-2 font-semibold text-gray-scale-900">2. Minhas Apostas</h3>
                      <p className="text-sm">
                        Na página <strong>"Minhas Apostas"</strong>, você verá o status de cada aposta:
                      </p>
                      <ul className="mt-2 list-disc list-inside space-y-1 text-sm text-gray-scale-600">
                        <li><strong>Pendente:</strong> Aguardando o sorteio</li>
                        <li><strong>Ganhou:</strong> Sua aposta foi premiada!</li>
                        <li><strong>Perdeu:</strong> Não correspondeu ao resultado</li>
                      </ul>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-4">
                      <h3 className="mb-2 font-semibold text-gray-scale-900">3. Notificações Automáticas</h3>
                      <p className="text-sm">
                        Quando uma aposta for premiada, você receberá uma notificação e o valor será creditado automaticamente na sua conta.
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Seção 6: Depósitos e Saques */}
            {activeSection === 'depositos-saques' && (
              <section className="rounded-xl bg-white p-6 shadow-md">
                <div className="mb-4 flex items-center gap-3">
                  <span className="text-2xl">💳</span>
                  <h2 className="text-2xl font-bold text-gray-scale-900">Depósitos e Saques</h2>
                </div>
                <div className="space-y-6">
                  <div>
                    <h3 className="mb-3 text-xl font-semibold text-gray-scale-900">💰 Como Fazer um Depósito</h3>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3 rounded-lg border border-gray-200 p-4">
                        <span className="text-xl">1️⃣</span>
                        <div>
                          <p className="text-gray-scale-700">
                            Acesse sua <strong>Carteira</strong> no menu principal
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 rounded-lg border border-gray-200 p-4">
                        <span className="text-xl">2️⃣</span>
                        <div>
                          <p className="text-gray-scale-700">
                            Clique em <strong>"Depositar"</strong> e escolha o valor
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 rounded-lg border border-gray-200 p-4">
                        <span className="text-xl">3️⃣</span>
                        <div>
                          <p className="text-gray-scale-700">
                            Escaneie o QR Code PIX ou copie o código para pagar
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 rounded-lg border border-gray-200 p-4">
                        <span className="text-xl">4️⃣</span>
                        <div>
                          <p className="text-gray-scale-700">
                            Após o pagamento, o saldo será creditado automaticamente em poucos minutos
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="mb-3 text-xl font-semibold text-gray-scale-900">💸 Como Fazer um Saque</h3>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3 rounded-lg border border-gray-200 p-4">
                        <span className="text-xl">1️⃣</span>
                        <div>
                          <p className="text-gray-scale-700">
                            Acesse sua <strong>Carteira</strong> e clique em <strong>"Sacar"</strong>
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 rounded-lg border border-gray-200 p-4">
                        <span className="text-xl">2️⃣</span>
                        <div>
                          <p className="text-gray-scale-700">
                            Informe o valor desejado (mínimo: R$ 10,00)
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 rounded-lg border border-gray-200 p-4">
                        <span className="text-xl">3️⃣</span>
                        <div>
                          <p className="text-gray-scale-700">
                            Informe sua chave PIX (CPF, e-mail, telefone ou chave aleatória)
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 rounded-lg border border-gray-200 p-4">
                        <span className="text-xl">4️⃣</span>
                        <div>
                          <p className="text-gray-scale-700">
                            Confirme e aguarde o processamento (geralmente em poucos minutos)
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 rounded-lg bg-yellow/10 p-4">
                      <p className="text-sm text-gray-scale-700">
                        ⚠️ <strong>Importante:</strong> O saque é processado via PIX e geralmente é instantâneo. 
                        Em caso de problemas, entre em contato com o suporte.
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Seção 7: Dicas */}
            {activeSection === 'dicas' && (
              <section className="rounded-xl bg-white p-6 shadow-md">
                <div className="mb-4 flex items-center gap-3">
                  <span className="text-2xl">💡</span>
                  <h2 className="text-2xl font-bold text-gray-scale-900">Dicas e Boas Práticas</h2>
                </div>
                <div className="space-y-4">
                  <div className="rounded-lg bg-green/5 p-4">
                    <h3 className="mb-2 font-semibold text-gray-scale-900">✅ Boas Práticas</h3>
                    <ul className="list-disc list-inside space-y-2 text-sm text-gray-scale-700">
                      <li>Estabeleça um limite de gastos antes de começar a apostar</li>
                      <li>Nunca aposte mais do que você pode perder</li>
                      <li>Mantenha um registro das suas apostas</li>
                      <li>Revise sempre os resultados antes de fazer novas apostas</li>
                      <li>Use a funcionalidade de "Repetir Aposta" para facilitar</li>
                    </ul>
                  </div>
                  <div className="rounded-lg bg-red/5 p-4">
                    <h3 className="mb-2 font-semibold text-gray-scale-900">❌ O que Evitar</h3>
                    <ul className="list-disc list-inside space-y-2 text-sm text-gray-scale-700">
                      <li>Não aposte quando estiver emocionalmente abalado</li>
                      <li>Não tente recuperar perdas aumentando as apostas</li>
                      <li>Não aposte valores que comprometam suas necessidades básicas</li>
                      <li>Não compartilhe suas credenciais de acesso</li>
                    </ul>
                  </div>
                  <div className="rounded-lg bg-blue/5 p-4">
                    <h3 className="mb-2 font-semibold text-gray-scale-900">🎯 Dicas de Estratégia</h3>
                    <ul className="list-disc list-inside space-y-2 text-sm text-gray-scale-700">
                      <li>Comece com apostas menores para entender o sistema</li>
                      <li>Diversifique suas apostas em diferentes modalidades</li>
                      <li>Use posições maiores (1º ao 5º) para aumentar as chances</li>
                      <li>Acompanhe os resultados anteriores para identificar padrões</li>
                    </ul>
                  </div>
                </div>
              </section>
            )}

            {/* Seção 8: Dúvidas */}
            {activeSection === 'duvidas' && (
              <section className="rounded-xl bg-white p-6 shadow-md">
                <div className="mb-4 flex items-center gap-3">
                  <span className="text-2xl">❓</span>
                  <h2 className="text-2xl font-bold text-gray-scale-900">Dúvidas Frequentes</h2>
                </div>
                <div className="space-y-4">
                  <div className="rounded-lg border border-gray-200 p-4">
                    <h3 className="mb-2 font-semibold text-gray-scale-900">Quanto tempo leva para receber um prêmio?</h3>
                    <p className="text-sm text-gray-scale-700">
                      Os prêmios são creditados automaticamente após a confirmação do resultado, geralmente em poucos minutos.
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-200 p-4">
                    <h3 className="mb-2 font-semibold text-gray-scale-900">Posso cancelar uma aposta?</h3>
                    <p className="text-sm text-gray-scale-700">
                      Não, após confirmar uma aposta ela não pode ser cancelada. Certifique-se de revisar todos os dados antes de confirmar.
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-200 p-4">
                    <h3 className="mb-2 font-semibold text-gray-scale-900">Qual o valor mínimo para apostar?</h3>
                    <p className="text-sm text-gray-scale-700">
                      O valor mínimo é R$ 0,50. Não há valor máximo, mas recomendamos apostar com responsabilidade.
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-200 p-4">
                    <h3 className="mb-2 font-semibold text-gray-scale-900">Como funciona a "Milhar Invertida"?</h3>
                    <p className="text-sm text-gray-scale-700">
                      Na Milhar Invertida, você aposta em todas as combinações possíveis dos 4 dígitos escolhidos. 
                      Por exemplo, se você escolher 2580, o sistema gera automaticamente todas as 24 combinações possíveis.
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-200 p-4">
                    <h3 className="mb-2 font-semibold text-gray-scale-900">O que significa "Para cada palpite" vs "Para todos os palpites"?</h3>
                    <p className="text-sm text-gray-scale-700">
                      <strong>"Para cada palpite":</strong> O valor informado será aplicado a cada palpite individualmente. 
                      Se você tem 3 palpites de R$ 2,00 cada, o total será R$ 6,00.<br/>
                      <strong>"Para todos os palpites":</strong> O valor será dividido igualmente entre todos os palpites. 
                      Se você tem 3 palpites e informa R$ 6,00, cada um valerá R$ 2,00.
                    </p>
                  </div>
                </div>
              </section>
            )}

            {/* Contato */}
            <section className="rounded-xl bg-gradient-to-r from-blue to-green p-6 text-white">
              <div className="flex flex-col items-center gap-4 text-center">
                <h2 className="text-2xl font-bold">Precisa de Mais Ajuda?</h2>
                <p className="text-white/90">
                  Nossa equipe de suporte está pronta para ajudar você!
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <a
                    href={`https://wa.me/${configuracoes.whatsappSuporte?.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 font-semibold text-green hover:bg-gray-100 transition-colors"
                  >
                    <span className="text-2xl">💬</span>
                    WhatsApp
                  </a>
                  <a
                    href={`mailto:${configuracoes.emailSuporte}`}
                    className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-6 py-3 font-semibold text-white hover:bg-white/20 transition-colors border border-white/20"
                  >
                    <span className="text-xl">📧</span>
                    E-mail
                  </a>
                </div>
                <p className="mt-4 text-sm text-white/80">
                  {configuracoes.numeroSuporte && `Telefone: ${configuracoes.numeroSuporte}`}
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
      <BottomNav />
    </div>
  )
}
