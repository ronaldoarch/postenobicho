'use client'

import { useEffect, useState } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import BottomNav from '@/components/BottomNav'
import BilheteAposta from '@/components/BilheteAposta'
import {
  buscarOdd,
  calcularValorPorPalpite,
  calcularNumero,
  calcularGrupo,
  calcularPremioUnidade,
  ModalityType,
  DivisionType,
} from '@/lib/bet-rules-engine'
import { MODALITIES } from '@/data/modalities'

interface Aposta {
  id: number
  concurso?: string | null
  loteria?: string | null
  estado?: string | null
  horario?: string | null
  dataConcurso?: string | null
  modalidade?: string | null
  aposta?: string | null
  valor: number
  retornoPrevisto?: number | null
  status: 'pendente' | 'ganhou' | 'perdeu'
  detalhes?: any
  createdAt: string | Date
  usuarioId?: number
}

interface Extracao {
  id: number
  name: string
  time?: string
  estado?: string
}

export default function MinhasApostasPage() {
  const [apostas, setApostas] = useState<Aposta[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selecionada, setSelecionada] = useState<Aposta | null>(null)
  const [apostaParaBilhete, setApostaParaBilhete] = useState<Aposta | null>(null)
  const [extracoes, setExtracoes] = useState<Extracao[]>([])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        // Carregar extrações para mapear IDs para nomes
        const extracoesRes = await fetch('/api/admin/extracoes')
        const extracoesData = await extracoesRes.json()
        setExtracoes(extracoesData.extracoes || [])

        // Carregar apostas
        const res = await fetch('/api/apostas', { credentials: 'include' })
        const data = await res.json()
        if (!res.ok) {
          throw new Error(data.error || 'Erro ao carregar apostas')
        }
        setApostas(data.apostas || [])
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar apostas')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Função para obter nome da loteria a partir do ID
  const getLoteriaName = (loteriaId: string | null | undefined): string => {
    if (!loteriaId) return '—'
    
    // Se já for um nome (não numérico), retornar como está
    if (isNaN(Number(loteriaId))) {
      return loteriaId
    }
    
    // Buscar extração pelo ID
    const extracao = extracoes.find((e) => e.id === Number(loteriaId))
    return extracao?.name || loteriaId
  }

  // Função para repetir uma aposta
  const repetirAposta = (aposta: Aposta) => {
    try {
      // Parsear detalhes da aposta
      let detalhesObj: any = {}
      if (aposta.detalhes) {
        try {
          detalhesObj = typeof aposta.detalhes === 'string' 
            ? JSON.parse(aposta.detalhes) 
            : aposta.detalhes
        } catch (e) {
          console.error('Erro ao parsear detalhes:', e)
        }
      }

      const betData = detalhesObj.betData || {}
      
      // Preparar dados para repetir a aposta
      const dadosRepeticao = {
        modality: betData.modality || aposta.modalidade || null,
        modalityName: detalhesObj.modalityName || betData.modalityName || aposta.modalidade || null,
        animalBets: betData.animalBets || [],
        numberBets: betData.numberBets || [],
        position: betData.position || null,
        customPosition: betData.customPosition || false,
        customPositionValue: betData.customPositionValue || null,
        amount: aposta.valor,
        divisionType: betData.divisionType || 'all',
        useBonus: betData.useBonus || false,
        bonusAmount: betData.bonusAmount || 0,
        location: aposta.loteria || null,
        instant: betData.instant || false,
        specialTime: aposta.horario || betData.specialTime || null,
      }

      // Salvar dados no localStorage para o BetFlow carregar
      localStorage.setItem('repetirAposta', JSON.stringify(dadosRepeticao))
      
      // Redirecionar para página de apostar
      window.location.href = '/apostar'
    } catch (error) {
      console.error('Erro ao repetir aposta:', error)
      alert('Erro ao repetir aposta. Por favor, tente novamente.')
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-scale-100">
      <Header />
      <main className="relative flex flex-1 flex-col overflow-auto bg-gray-scale-100 text-[#1C1C1C]">
        <div className="mx-auto flex w-full max-w-[1286px] flex-col gap-4 px-4 py-6 md:px-6 md:py-8 lg:px-8">
          <h1 className="text-2xl font-bold text-gray-900">Minhas apostas</h1>
          {loading && <div className="text-gray-600">Carregando...</div>}
          {error && <div className="text-red-600">{error}</div>}

          {!loading && !error && apostas.length === 0 && (
            <div className="rounded-lg border border-dashed border-gray-200 bg-white px-4 py-6 text-sm text-gray-700">
              Nenhuma aposta encontrada. Faça login e realize uma aposta.
            </div>
          )}

          {!loading && !error && apostas.length > 0 && (
            <div className="overflow-x-auto rounded-xl bg-white shadow">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 text-left text-sm font-semibold text-gray-700">
                    <th className="px-4 py-3">Concurso</th>
                    <th className="px-4 py-3">Aposta</th>
                    <th className="px-4 py-3">Data</th>
                    <th className="px-4 py-3">Valor</th>
                    <th className="px-4 py-3">Retorno</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {apostas.map((a) => (
                    <tr key={a.id} className="border-b border-gray-100 text-sm text-gray-800">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-900">{a.concurso || '—'}</div>
                        <div className="text-xs text-gray-500">
                          {[getLoteriaName(a.loteria), a.estado, a.horario].filter(Boolean).join(' • ')}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {(() => {
                          // Tentar extrair modalidade dos detalhes se disponível
                          let modalidadeDisplay = a.aposta || a.modalidade || '—'
                          
                          // Se os detalhes contiverem modalityName, usar isso
                          if (a.detalhes && typeof a.detalhes === 'object') {
                            const detalhesObj = typeof a.detalhes === 'string' 
                              ? JSON.parse(a.detalhes) 
                              : a.detalhes
                            
                            if (detalhesObj.modalityName) {
                              // Reconstruir texto da aposta com modalidade correta
                              const numeroApostado = detalhesObj.numberNames || detalhesObj.betData?.numberBets?.join(' | ')
                              const animalNames = detalhesObj.animalNames || detalhesObj.betData?.animalBets?.map((bet: number[]) => 
                                bet.map((n) => String(n).padStart(2, '0')).join('-')
                              ).join(' | ')
                              
                              if (numeroApostado) {
                                modalidadeDisplay = `${detalhesObj.modalityName}: ${numeroApostado}`
                              } else if (animalNames) {
                                modalidadeDisplay = `${detalhesObj.modalityName}: ${animalNames}`
                              } else {
                                modalidadeDisplay = detalhesObj.modalityName
                              }
                            }
                          }
                          
                          return modalidadeDisplay
                        })()}
                      </td>
                      <td className="px-4 py-3">
                        {a.dataConcurso ? new Date(a.dataConcurso).toLocaleString('pt-BR') : '—'}
                      </td>
                      <td className="px-4 py-3">R$ {Number(a.valor || 0).toFixed(2)}</td>
                      <td className="px-4 py-3">R$ {Number(a.retornoPrevisto || 0).toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-semibold ${
                            a.status === 'ganhou'
                              ? 'bg-green-100 text-green-800'
                              : a.status === 'pendente'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {a.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <button
                            onClick={() => repetirAposta(a)}
                            className="text-sm font-semibold text-green-600 hover:text-green-700 flex items-center gap-1"
                            title="Repetir esta aposta"
                          >
                            <span className="iconify i-material-symbols:refresh text-lg"></span>
                            Repetir
                          </button>
                          <button
                            onClick={() => setApostaParaBilhete(a)}
                            className="text-sm font-semibold text-gray-700 hover:text-gray-900 flex items-center gap-1"
                            title="Ver bilhete"
                          >
                            <span className="iconify i-fluent:ticket-diagonal-16-regular"></span>
                            Bilhete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
      <Footer />
      <BottomNav />

      {selecionada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Detalhes da aposta</h2>
                <p className="text-sm text-gray-500">
                  {selecionada.concurso || '—'} •{' '}
                  {selecionada.dataConcurso
                    ? new Date(selecionada.dataConcurso).toLocaleString('pt-BR')
                    : '—'}
                </p>
              </div>
              <button
                onClick={() => setSelecionada(null)}
                className="rounded-full bg-gray-100 px-3 py-1 text-sm font-semibold text-gray-700 hover:bg-gray-200"
              >
                Fechar
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm text-gray-800">
              <Detail 
                label="Modalidade" 
                value={(() => {
                  // Tentar extrair modalidade dos detalhes se disponível
                  if (selecionada.detalhes && typeof selecionada.detalhes === 'object') {
                    const detalhesObj = typeof selecionada.detalhes === 'string' 
                      ? JSON.parse(selecionada.detalhes) 
                      : selecionada.detalhes
                    
                    if (detalhesObj.modalityName) {
                      return detalhesObj.modalityName
                    }
                  }
                  return selecionada.modalidade || '—'
                })()} 
              />
              <Detail label="Status" value={selecionada.status} />
              <Detail label="Aposta" value={selecionada.aposta || '—'} />
              <Detail
                label="Valor apostado"
                value={`R$ ${Number(selecionada.valor || 0).toFixed(2)}`}
              />
              {(() => {
                // Calcular retorno mínimo e máximo se os detalhes estiverem disponíveis
                let retornoMinimo = null
                let retornoMaximo = null
                
                if (selecionada.detalhes) {
                  try {
                    const detalhesObj = typeof selecionada.detalhes === 'string' 
                      ? JSON.parse(selecionada.detalhes) 
                      : selecionada.detalhes
                    
                    // Verificar se já temos os valores calculados nos detalhes
                    if (detalhesObj.retornoMinimo !== undefined && detalhesObj.retornoMaximo !== undefined) {
                      retornoMinimo = detalhesObj.retornoMinimo
                      retornoMaximo = detalhesObj.retornoMaximo
                    } else if (detalhesObj.betData) {
                      // Usar valores hardcoded como fallback (não podemos usar await em IIFE)
                      // O cálculo completo será feito no backend durante a criação da aposta
                      const { buscarOddSync } = require('@/lib/bet-rules-engine')
                      const modalityMap: Record<string, any> = {
                        'Grupo': 'GRUPO',
                        'Dupla de Grupo': 'DUPLA_GRUPO',
                        'Terno de Grupo': 'TERNO_GRUPO',
                        'Quadra de Grupo': 'QUADRA_GRUPO',
                        'Dezena': 'DEZENA',
                        'Centena': 'CENTENA',
                        'Milhar': 'MILHAR',
                        'Dezena Invertida': 'DEZENA_INVERTIDA',
                        'Centena Invertida': 'CENTENA_INVERTIDA',
                        'Milhar Invertida': 'MILHAR_INVERTIDA',
                        'Milhar/Centena': 'MILHAR_CENTENA',
                      }
                      const betData = detalhesObj.betData
                      const modalityType = modalityMap[betData.modalityName] || 'GRUPO'
                      const pos_from = betData.position?.includes('-') ? parseInt(betData.position.split('-')[0]) : 1
                      const pos_to = betData.position?.includes('-') ? parseInt(betData.position.split('-')[1]) : 5
                      const odd = buscarOddSync(modalityType, pos_from, pos_to)
                      // Usar valores aproximados baseados na odd hardcoded
                      retornoMinimo = selecionada.valor * odd * 0.1
                      retornoMaximo = selecionada.valor * odd * 5
                    }
                  } catch (e) {
                    console.error('Erro ao calcular retorno:', e)
                  }
                }
                
                if (retornoMinimo !== null && retornoMaximo !== null && retornoMinimo > 0) {
                  return (
                    <div className="col-span-2 rounded-lg border border-gray-100 bg-blue/10 px-3 py-2">
                      <p className="text-xs text-gray-500 mb-2 font-semibold">Retorno Previsto por Palpite:</p>
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600">Mínimo possível:</span>
                          <span className="font-semibold text-gray-900">
                            R$ {Number(retornoMinimo).toFixed(2)}
                          </span>
                        </div>
                        {retornoMaximo !== retornoMinimo && (
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-600">Máximo possível:</span>
                            <span className="font-semibold text-green-600">
                              R$ {Number(retornoMaximo).toFixed(2)}
                            </span>
                          </div>
                        )}
                      </div>
                      <p className="mt-2 text-xs text-gray-500 italic">
                        💡 O retorno por palpite varia conforme quantas posições ele acertar (1 até todas as posições)
                      </p>
                    </div>
                  )
                } else {
                  // Fallback para retorno previsto simples
                  return (
                    <Detail
                      label="Retorno previsto"
                      value={`R$ ${Number(selecionada.retornoPrevisto || 0).toFixed(2)}`}
                    />
                  )
                }
              })()}
              <Detail label="Horário" value={selecionada.horario || '—'} />
              <Detail label="Loteria" value={getLoteriaName(selecionada.loteria)} />
              <Detail label="Estado" value={selecionada.estado || '—'} />
            </div>

            {selecionada.detalhes && (() => {
              // Parsear detalhes se for string
              let detalhesObj: any = {}
              try {
                detalhesObj = typeof selecionada.detalhes === 'string' 
                  ? JSON.parse(selecionada.detalhes) 
                  : selecionada.detalhes
              } catch (e) {
                detalhesObj = {}
              }

              const betData = detalhesObj.betData || {}
              const hasAnimalBets = Array.isArray(betData.animalBets) && betData.animalBets.length > 0
              const hasNumberBets = Array.isArray(betData.numberBets) && betData.numberBets.length > 0
              const hasNumbers = Array.isArray(betData.numbers) && betData.numbers.length > 0

              return (
                <div className="mt-6 rounded-lg border border-gray-100 bg-gray-50 p-4 text-sm text-gray-800">
                  <h3 className="mb-4 font-semibold text-gray-900">Palpites</h3>

                  {/* Palpites de animais (animalBets) */}
                  {hasAnimalBets && (
                    <div className="mb-4">
                      <p className="mb-2 text-xs font-semibold text-gray-700">Animais/Grupos:</p>
                      <div className="flex flex-wrap gap-2">
                        {betData.animalBets.map((bet: number[], idx: number) => (
                          <span
                            key={idx}
                            className="flex items-center gap-2 rounded-lg bg-amber-200 px-3 py-1.5 text-xs font-semibold text-gray-900"
                          >
                            {bet.map((n) => String(n).padStart(2, '0')).join('-')}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Palpites numéricos (numberBets) */}
                  {hasNumberBets && (
                    <div className="mb-4">
                      <p className="mb-2 text-xs font-semibold text-gray-700">Números:</p>
                      <div className="flex flex-wrap gap-2">
                        {betData.numberBets.map((numero: string, idx: number) => (
                          <span
                            key={idx}
                            className="flex items-center gap-2 rounded-lg bg-blue-100 px-3 py-1.5 text-xs font-semibold text-blue-900"
                          >
                            {numero}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Números alternativos (numbers) */}
                  {hasNumbers && !hasNumberBets && (
                    <div className="mb-4">
                      <p className="mb-2 text-xs font-semibold text-gray-700">Números:</p>
                      <div className="flex flex-wrap gap-2">
                        {betData.numbers.map((numero: string, idx: number) => (
                          <span
                            key={idx}
                            className="flex items-center gap-2 rounded-lg bg-blue-100 px-3 py-1.5 text-xs font-semibold text-blue-900"
                          >
                            {numero}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Informações adicionais */}
                  {(betData.position || betData.divisionType) && (
                    <div className="mt-4 space-y-2 border-t border-gray-200 pt-4">
                      {betData.position && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-gray-700">Posição:</span>
                          <span className="text-gray-900">
                            {betData.position}
                            {betData.customPosition && ' (Personalizada)'}
                          </span>
                        </div>
                      )}
                      {betData.divisionType && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-gray-700">Divisão:</span>
                          <span className="text-gray-900">
                            {betData.divisionType === 'each' ? 'Por palpite' : 'Total dividido'}
                          </span>
                        </div>
                      )}
                      {betData.modalityName && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-gray-700">Modalidade (detalhes):</span>
                          <span className="text-gray-900">{betData.modalityName}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Fallback: JSON bruto apenas se não houver nenhum dado útil */}
                  {!hasAnimalBets && !hasNumberBets && !hasNumbers && (
                    <div className="mt-4">
                      <p className="mb-2 text-xs font-semibold text-gray-700">Dados técnicos:</p>
                      <pre className="max-h-48 overflow-auto whitespace-pre-wrap rounded bg-gray-100 p-2 text-xs text-gray-700">
                        {JSON.stringify(detalhesObj, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )
            })()}
          </div>
        </div>
      )}

      {/* Modal do Bilhete */}
      {apostaParaBilhete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8 overflow-y-auto">
          <div className="w-full max-w-md">
            <BilheteAposta 
              aposta={apostaParaBilhete} 
              onClose={() => setApostaParaBilhete(null)}
              showPrintButton={true}
            />
          </div>
        </div>
      )}
    </div>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-100 bg-white px-3 py-2">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="font-semibold text-gray-900">{value}</p>
    </div>
  )
}

// Função para calcular retorno mínimo e máximo
async function calculateReturnRange(betData: any, valorTotal: number): Promise<{ min: number; max: number }> {
  try {
    if (!betData.position || !betData.modalityName || (!betData.animalBets?.length && !betData.numberBets?.length)) {
      return { min: 0, max: 0 }
    }

    // Parsear posição
    let pos_from = 1
    let pos_to = 5
    const positionToUse = betData.customPosition && betData.customPositionValue 
      ? betData.customPositionValue.trim() 
      : betData.position
    
    if (positionToUse) {
      if (positionToUse === '1st') {
        pos_from = 1
        pos_to = 1
      } else if (positionToUse.includes('-')) {
        const [from, to] = positionToUse.split('-').map(Number)
        pos_from = from || 1
        pos_to = to || 5
      } else {
        const singlePos = parseInt(positionToUse.replace(/º/g, '').replace(/\s/g, ''), 10)
        if (!isNaN(singlePos) && singlePos >= 1 && singlePos <= 7) {
          pos_from = singlePos
          pos_to = singlePos
        }
      }
    }

    // Mapear modalidade
    const modalityMap: Record<string, ModalityType> = {
      'Grupo': 'GRUPO',
      'Dupla de Grupo': 'DUPLA_GRUPO',
      'Terno de Grupo': 'TERNO_GRUPO',
      'Quadra de Grupo': 'QUADRA_GRUPO',
      'Dezena': 'DEZENA',
      'Centena': 'CENTENA',
      'Milhar': 'MILHAR',
      'Dezena Invertida': 'DEZENA_INVERTIDA',
      'Centena Invertida': 'CENTENA_INVERTIDA',
      'Milhar Invertida': 'MILHAR_INVERTIDA',
      'Milhar/Centena': 'MILHAR_CENTENA',
      'Passe vai': 'PASSE',
      'Passe vai e vem': 'PASSE_VAI_E_VEM',
      'Quadra de Dezena': 'QUADRA_DEZENA',
      'Duque de Dezena (EMD)': 'DUQUE_DEZENA_EMD',
      'Terno de Dezena (EMD)': 'TERNO_DEZENA_EMD',
      'Dezeninha': 'DEZENINHA',
      'Terno de Grupo Seco': 'TERNO_GRUPO_SECO',
    }
    
    const modalityType = modalityMap[betData.modalityName] || 'GRUPO'
    const isNumberModality = betData.numberBets?.length > 0
    const qtdPalpites = isNumberModality 
      ? (betData.numberBets?.length || 0)
      : (betData.animalBets?.length || 0)

    // Calcular valor por palpite
    const valorPorPalpite = calcularValorPorPalpite(
      valorTotal,
      qtdPalpites,
      (betData.divisionType || 'all') as DivisionType
    )

    // Buscar odd do banco primeiro (se admin alterou), senão usa hardcoded
    const betRulesEngine = await import('@/lib/bet-rules-engine')
    const buscarOddFn = betRulesEngine.buscarOdd as any
    let odd = await buscarOddFn(modalityType, pos_from, pos_to, betData.modality ? parseInt(betData.modality) : undefined, betData.modalityName || undefined)

    // Calcular unidades e prêmio por unidade
    let calculation: any
    if (modalityType.includes('GRUPO')) {
      const qtdGrupos = isNumberModality ? 0 : (betData.animalBets?.[0]?.length || 0)
      calculation = calcularGrupo(modalityType, qtdGrupos, pos_from, pos_to, valorPorPalpite)
    } else {
      const numeroExemplo = isNumberModality ? (betData.numberBets?.[0] || '0000') : '0000'
      calculation = calcularNumero(modalityType, numeroExemplo, pos_from, pos_to, valorPorPalpite)
    }

    const premioUnidade = calcularPremioUnidade(odd, calculation.unitValue)
    const qtdPosicoes = calculation.positions

    // Retorno mínimo (1 posição) e máximo (todas as posições)
    const retornoMinimoPorPalpite = premioUnidade * 1
    const retornoMaximoPorPalpite = premioUnidade * qtdPosicoes

    return {
      min: retornoMinimoPorPalpite,
      max: retornoMaximoPorPalpite,
    }
  } catch (error) {
    console.error('Erro ao calcular retorno:', error)
    return { min: 0, max: 0 }
  }
}
