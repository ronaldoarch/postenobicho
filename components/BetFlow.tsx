'use client'

import { useEffect, useMemo, useState } from 'react'
import { BetData } from '@/types/bet'
import { ANIMALS } from '@/data/animals'
import { MODALITIES } from '@/data/modalities'
import ProgressIndicator from './ProgressIndicator'
import SpecialQuotationsModal from './SpecialQuotationsModal'
import ModalitySelection from './ModalitySelection'
import AnimalSelection from './AnimalSelection'
import NumberCalculator from './NumberCalculator'
import PositionAmountDivision from './PositionAmountDivision'
import LocationSelection from './LocationSelection'
import BetConfirmation from './BetConfirmation'
import InstantResultModal from './InstantResultModal'
import CotacaoAlertaModal from './CotacaoAlertaModal'
import AlertaBonito from './AlertaBonito'

const INITIAL_BET_DATA: BetData = {
  modality: null,
  animalBets: [],
  numberBets: [],
  position: null,
  customPosition: false,
  customPositionValue: undefined,
  amount: 2.0,
  divisionType: 'all',
  useBonus: false,
  bonusAmount: 0,
  location: null,
  instant: false,
  specialTime: null,
}

export default function BetFlow() {
  const [currentStep, setCurrentStep] = useState(1)
  const [betData, setBetData] = useState<BetData>(INITIAL_BET_DATA)
  const [showSpecialModal, setShowSpecialModal] = useState(false)
  const [activeTab, setActiveTab] = useState<'bicho' | 'loteria'>('bicho')
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [showInstantResult, setShowInstantResult] = useState(false)
  const [instantResult, setInstantResult] = useState<{ prizes: number[]; groups: number[]; premioTotal: number } | null>(null)
  const [showCotacaoAlerta, setShowCotacaoAlerta] = useState(false)
  const [cotacaoAlerta, setCotacaoAlerta] = useState<{ tipo: 'milhar' | 'centena'; numero: string; cotacao: number | null } | null>(null)
  const [pendingPayload, setPendingPayload] = useState<any>(null)
  const [alertaBonito, setAlertaBonito] = useState<{ tipo: 'sucesso' | 'erro' | 'aviso' | 'info'; titulo: string; mensagem: string } | null>(null)

  const MAX_PALPITES = 10

  // Detectar se é modalidade numérica
  const isNumberModality = useMemo(() => {
    const modalityName = betData.modalityName || ''
    const numberModalities = [
      'Milhar',
      'Centena',
      'Dezena',
      'Milhar Invertida',
      'Centena Invertida',
      'Dezena Invertida',
      'Milhar/Centena',
      'Milhar Centena',
      'Duque de Dezena',
      'Terno de Dezena',
      'Terno de Dezena Seco',
      'Quadra de Dezena',
      'Duque de Dezena EMD',
      'Duque de Dezena (EMD)',
      'Terno de Dezena EMD',
      'Terno de Dezena (EMD)',
      'Dezeninha',
    ]
    return numberModalities.includes(modalityName)
  }, [betData.modalityName])

  const requiredAnimalsPerBet = useMemo(
    () => getRequiredAnimalsPerBet(betData.modalityName || betData.modality),
    [betData.modality, betData.modalityName]
  )

  const animalsValid = betData.animalBets.length > 0 && betData.animalBets.length <= MAX_PALPITES
  const numbersValid = betData.numberBets.length > 0 && betData.numberBets.length <= MAX_PALPITES
  const step2Valid = isNumberModality ? numbersValid : animalsValid

  // Carregar dados de repetição de aposta do localStorage ao montar o componente
  useEffect(() => {
    try {
      const dadosRepeticao = localStorage.getItem('repetirAposta')
      if (dadosRepeticao) {
        const dados = JSON.parse(dadosRepeticao)
        localStorage.removeItem('repetirAposta') // Limpar após carregar
        
        const dadosCarregados: BetData = {
          ...INITIAL_BET_DATA,
          ...dados,
        }
        
        setBetData(dadosCarregados)
        
        // Ajustar step inicial baseado nos dados carregados
        if (dadosCarregados.modality || dadosCarregados.modalityName) {
          if ((dadosCarregados.animalBets.length > 0 || dadosCarregados.numberBets.length > 0) && dadosCarregados.position) {
            setCurrentStep(3) // Já tem tudo preenchido
          } else {
            setCurrentStep(2) // Tem modalidade, falta palpites
          }
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados de repetição:', error)
    }
  }, [])

  useEffect(() => {
    const loadMe = async () => {
      try {
        const res = await fetch('/api/auth/me')
        const data = await res.json()
        setIsAuthenticated(Boolean(data?.user))
        if (data?.user) {
          setBetData((prev) => ({ ...prev, bonusAmount: data.user.bonus ?? 0 }))
        } else {
          setBetData((prev) => ({ ...prev, bonusAmount: 0 }))
        }
      } catch (error) {
        setIsAuthenticated(false)
        setBetData((prev) => ({ ...prev, bonusAmount: 0 }))
      }
    }
    loadMe()
  }, [])

  const handleNext = () => {
    if (currentStep === 2 && !step2Valid) return
    
    // Validação de posição no step 3
    if (currentStep === 3) {
      if (!betData.customPosition && !betData.position) {
        setAlertaBonito({
          tipo: 'aviso',
          titulo: 'Posição Obrigatória',
          mensagem: 'Por favor, selecione uma posição ou marque "Personalizado" e digite uma posição válida.',
        })
        return
      }
      
      if (betData.customPosition && (!betData.customPositionValue || betData.customPositionValue.trim() === '')) {
        setAlertaBonito({
          tipo: 'aviso',
          titulo: 'Posição Personalizada',
          mensagem: 'Por favor, digite uma posição personalizada (ex: 1-5, 7, 5, etc.).',
        })
        return
      }
      
      // Validar formato da posição personalizada
      if (betData.customPosition && betData.customPositionValue) {
        const cleanedPos = betData.customPositionValue.replace(/º/g, '').replace(/\s/g, '')
        const isValidFormat = /^\d+(-\d+)?$/.test(cleanedPos)
        
        if (!isValidFormat) {
          setAlertaBonito({
            tipo: 'aviso',
            titulo: 'Formato Inválido',
            mensagem: 'Use números (ex: 1, 2, 3) ou ranges (ex: 1-5, 2-7).',
          })
          return
        }
        
        // Validar valores (entre 1 e 7)
        const parts = cleanedPos.split('-')
        const firstNum = parseInt(parts[0], 10)
        const secondNum = parts[1] ? parseInt(parts[1], 10) : firstNum
        
        if (firstNum < 1 || firstNum > 7 || secondNum < 1 || secondNum > 7 || firstNum > secondNum) {
          setAlertaBonito({
            tipo: 'aviso',
            titulo: 'Posição Inválida',
            mensagem: 'Use valores entre 1 e 7. Exemplos: "1-5", "7", "3", "1-7".',
          })
          return
        }
      }
    }
    
    const nextStep = currentStep + 1
    if (nextStep >= 3 && !isAuthenticated) {
      setAlertaBonito({
        tipo: 'info',
        titulo: 'Login Necessário',
        mensagem: 'Você precisa estar logado para continuar. Faça login para usar seu saldo.',
      })
      setTimeout(() => {
        window.location.href = '/login'
      }, 2000)
      return
    }
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleAddAnimalBet = (ids: number[]) => {
    setBetData((prev) => {
      if (prev.animalBets.length >= MAX_PALPITES) return prev
      return { ...prev, animalBets: [...prev.animalBets, ids] }
    })
  }

  const handleRemoveAnimalBet = (index: number) => {
    setBetData((prev) => ({
      ...prev,
      animalBets: prev.animalBets.filter((_, i) => i !== index),
    }))
  }

  const handleAddNumberBet = (number: string) => {
    setBetData((prev) => {
      if (prev.numberBets.length >= MAX_PALPITES) return prev
      return { ...prev, numberBets: [...prev.numberBets, number] }
    })
  }

  const handleRemoveNumberBet = (index: number) => {
    setBetData((prev) => ({
      ...prev,
      numberBets: prev.numberBets.filter((_, i) => i !== index),
    }))
  }

  const handleConfirm = async () => {
    // Usar modalityName se disponível, senão buscar pelo ID
    // IMPORTANTE: Priorizar sempre modalityName para garantir que a modalidade correta seja salva
    let modalityName = betData.modalityName
    
    if (!modalityName && betData.modality) {
      // Se não tiver modalityName, buscar pelo ID
      const modality = MODALITIES.find((m) => String(m.id) === betData.modality)
      modalityName = modality?.name || 'Modalidade'
      
      // Atualizar betData para garantir que modalityName esteja definido
      setBetData({
        ...betData,
        modalityName: modalityName,
      })
    }
    
    if (!modalityName) {
      modalityName = 'Modalidade'
    }
    
    // Formatar palpites (animais ou números)
    const animalNames = betData.animalBets
      .map((grp) =>
        grp
          .map((id) => ANIMALS.find((a) => a.id === id)?.name || `Animal ${String(id).padStart(2, '0')}`)
          .join('-'),
      )
      .join(' | ')
    
    const numberNames = betData.numberBets.join(' | ')
    const apostaText = isNumberModality 
      ? `${modalityName}: ${numberNames}`
      : `${modalityName}: ${animalNames}`

    // Buscar extração selecionada para obter estado e horário
    let estado: string | null = null
    let horario: string | null = betData.specialTime || null
    
    if (betData.location) {
      try {
        const res = await fetch('/api/admin/extracoes')
        const data = await res.json()
        const extracao = (data?.extracoes || []).find((e: any) => e.id.toString() === betData.location)
        if (extracao) {
          estado = extracao.estado || null
          if (!horario && extracao.time) {
            horario = extracao.time
          }
        }
      } catch (error) {
        console.error('Erro ao buscar extração:', error)
      }
    }

    // Calcular retorno previsto baseado na modalidade e posição
    let retornoPrevisto = 0
    const hasPalpites = isNumberModality 
      ? betData.numberBets.length > 0 
      : betData.animalBets.length > 0
    if (betData.position && betData.modality && hasPalpites) {
      try {
        // Parsear posição (ex: "1-5" ou "7")
        let pos_from = 1
        let pos_to = 5
        
        if (betData.customPosition && betData.customPositionValue) {
          const cleanedPos = betData.customPositionValue.replace(/º/g, '').replace(/\s/g, '')
          const positionParts = cleanedPos.includes('-') 
            ? cleanedPos.split('-').map(p => parseInt(p.trim()))
            : [parseInt(cleanedPos.trim()), parseInt(cleanedPos.trim())]
          
          if (positionParts.length === 2 && !isNaN(positionParts[0]) && !isNaN(positionParts[1])) {
            pos_from = positionParts[0]
            pos_to = positionParts[1]
          }
        } else if (betData.position) {
          const positionParts = betData.position.includes('-') 
            ? betData.position.split('-').map(p => parseInt(p.trim()))
            : [parseInt(betData.position.trim()), parseInt(betData.position.trim())]
          
          if (positionParts.length === 2 && !isNaN(positionParts[0]) && !isNaN(positionParts[1])) {
            pos_from = positionParts[0]
            pos_to = positionParts[1]
          }
        }
        
        // Mapear nome da modalidade para ModalityType
        const modalityMap: Record<string, string> = {
          'Grupo': 'GRUPO',
          'Dupla de Grupo': 'DUPLA_GRUPO',
          'Terno de Grupo': 'TERNO_GRUPO',
          'Quadra de Grupo': 'QUADRA_GRUPO',
          'Quina de Grupo': 'QUINA_GRUPO',
          'Dezena': 'DEZENA',
          'Centena': 'CENTENA',
          'Milhar': 'MILHAR',
          'Milhar Invertida': 'MILHAR_INVERTIDA',
          'Centena Invertida': 'CENTENA_INVERTIDA',
          'Dezena Invertida': 'DEZENA_INVERTIDA',
          'Duque de Dezena': 'DUQUE_DEZENA',
          'Terno de Dezena': 'TERNO_DEZENA',
          'Terno de Dezena Seco': 'TERNO_DEZENA', // Mesmo tipo que Terno de Dezena
          'Quadra de Dezena': 'QUADRA_DEZENA',
          'Duque de Dezena EMD': 'DUQUE_DEZENA_EMD',
          'Duque de Dezena (EMD)': 'DUQUE_DEZENA_EMD',
          'Terno de Dezena EMD': 'TERNO_DEZENA_EMD',
          'Terno de Dezena (EMD)': 'TERNO_DEZENA_EMD',
          'Passe vai': 'PASSE',
          'Passe vai e vem': 'PASSE_VAI_E_VEM',
          'Passe Vai e Vem': 'PASSE_VAI_E_VEM',
          'Milhar Centena': 'MILHAR_CENTENA',
          'Dezeninha': 'DEZENINHA',
          'Terno de Grupo Seco': 'TERNO_GRUPO_SECO',
        }
        
        const modalityType = modalityMap[modalityName] || 'GRUPO'
        
        // Usar a mesma lógica de cálculo do sistema de premiação
        const { buscarOdd, calcularValorPorPalpite, calcularNumero, calcularGrupo } = await import('@/lib/bet-rules-engine')
        const qtdPalpites = isNumberModality ? betData.numberBets.length : betData.animalBets.length
        
        // Calcular valor por palpite usando a mesma função do sistema
        const valorPorPalpite = calcularValorPorPalpite(
          betData.amount,
          qtdPalpites,
          betData.divisionType
        )
        
        // Buscar odd da modalidade
        let odd = buscarOdd(modalityType as any, pos_from, pos_to)
        
        // Verificar se milhar ou centena está cotada e ajustar odd
        if (isNumberModality && betData.numberBets.length > 0 && (modalityType === 'MILHAR' || modalityType === 'CENTENA' || modalityType === 'MILHAR_CENTENA')) {
          const numeroApostado = betData.numberBets[0]
          const numeroLimpo = numeroApostado.replace(/\D/g, '')
          
          try {
            if (modalityType === 'MILHAR' || modalityType === 'MILHAR_CENTENA') {
              const milharFormatada = numeroLimpo.padStart(4, '0').slice(-4)
              const res = await fetch(`/api/cotacao/verificar?tipo=milhar&numero=${milharFormatada}`)
              const { cotada, cotacao } = await res.json()
              
              if (cotada && cotacao !== null && cotacao > 0) {
                // Usar cotação especial em vez da odd normal
                odd = cotacao
              }
            }
            
            if (modalityType === 'CENTENA' || modalityType === 'MILHAR_CENTENA') {
              const centenaFormatada = numeroLimpo.padStart(4, '0').slice(-3)
              const res = await fetch(`/api/cotacao/verificar?tipo=centena&numero=${centenaFormatada}`)
              const { cotada, cotacao } = await res.json()
              
              if (cotada && cotacao !== null && cotacao > 0) {
                // Para MILHAR_CENTENA, usar a maior cotação entre milhar e centena
                // Para CENTENA, usar a cotação da centena
                if (modalityType === 'MILHAR_CENTENA') {
                  odd = Math.max(odd, cotacao)
                } else {
                  odd = cotacao
                }
              }
            }
          } catch (error) {
            console.error('Erro ao verificar cotação especial:', error)
            // Continuar com odd normal em caso de erro
          }
        }
        
        // Calcular unidades e valor unitário (simulando um palpite ganhador)
        let calculation: any
        if (modalityType.includes('GRUPO')) {
          const qtdGrupos = isNumberModality ? 0 : (betData.animalBets[0]?.length || 0)
          calculation = calcularGrupo(modalityType as any, qtdGrupos, pos_from, pos_to, valorPorPalpite)
        } else {
          // Para modalidades numéricas, usar o primeiro número como exemplo
          const numeroExemplo = isNumberModality ? betData.numberBets[0] : '0000'
          calculation = calcularNumero(modalityType as any, numeroExemplo, pos_from, pos_to, valorPorPalpite)
        }
        
        // Calcular prêmio por unidade (assumindo que ganhou)
        const premioUnidade = odd * calculation.unitValue
        
        // Retorno previsto = prêmio por unidade * quantidade de unidades que ganhariam * quantidade de palpites
        // Assumindo que cada palpite ganha 1 vez (hits = 1)
        const hitsPorPalpite = 1
        const retornoPorPalpite = hitsPorPalpite * premioUnidade
        retornoPrevisto = retornoPorPalpite * qtdPalpites
      } catch (error) {
        console.error('Erro ao calcular retorno previsto:', error)
      }
    }

    const payload = {
      concurso: betData.location ? `Extração ${betData.location}` : null,
      loteria: betData.location,
      estado: estado || null,
      horario: horario,
      dataConcurso: new Date().toISOString(),
      modalidade: modalityName,
      aposta: apostaText,
      valor: betData.amount,
      retornoPrevisto: retornoPrevisto,
      status: 'pendente',
      useBonus: betData.useBonus,
      detalhes: {
        betData,
        modalityName,
        animalNames: isNumberModality ? undefined : animalNames,
        numberNames: isNumberModality ? numberNames : undefined,
        isNumberModality,
      },
    }

    // Verificar se há milhar ou centena cotada antes de finalizar
    if (isNumberModality && betData.numberBets.length > 0) {
      for (const numeroApostado of betData.numberBets) {
        const numeroLimpo = numeroApostado.replace(/\D/g, '')
        
        // Verificar milhar cotada
        if (modalityName === 'Milhar' || modalityName === 'Milhar Invertida' || modalityName === 'Milhar/Centena' || modalityName === 'Milhar Centena') {
          const milharFormatada = numeroLimpo.padStart(4, '0').slice(-4)
          try {
            const res = await fetch(`/api/cotacao/verificar?tipo=milhar&numero=${milharFormatada}`)
            const { cotada, cotacao } = await res.json()
            
            if (cotada) {
              setCotacaoAlerta({
                tipo: 'milhar',
                numero: milharFormatada,
                cotacao,
              })
              setPendingPayload(payload)
              setShowCotacaoAlerta(true)
              return // Não finaliza ainda, aguarda confirmação do usuário
            }
          } catch (error) {
            console.error('Erro ao verificar milhar cotada:', error)
          }
        }
        
        // Verificar centena cotada
        if (modalityName === 'Centena' || modalityName === 'Centena Invertida' || modalityName === 'Milhar/Centena' || modalityName === 'Milhar Centena') {
          const centenaFormatada = numeroLimpo.padStart(3, '0').slice(-3)
          try {
            const res = await fetch(`/api/cotacao/verificar?tipo=centena&numero=${centenaFormatada}`)
            const { cotada, cotacao } = await res.json()
            
            if (cotada) {
              setCotacaoAlerta({
                tipo: 'centena',
                numero: centenaFormatada,
                cotacao,
              })
              setPendingPayload(payload)
              setShowCotacaoAlerta(true)
              return // Não finaliza ainda, aguarda confirmação do usuário
            }
          } catch (error) {
            console.error('Erro ao verificar centena cotada:', error)
          }
        }
      }
    }

    // Se não há cotação ou usuário já confirmou, finaliza a aposta
    submitBet(payload)
  }

  const submitBet = async (payload: any) => {
    fetch('/api/apostas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error || 'Erro ao criar aposta')
        }
        const data = await res.json()
        if (betData.instant && data.aposta?.detalhes?.resultadoInstantaneo) {
          setInstantResult({
            prizes: data.aposta.detalhes.resultadoInstantaneo.prizes,
            groups: data.aposta.detalhes.resultadoInstantaneo.groups,
            premioTotal: data.aposta.detalhes.premioTotal || 0,
          })
          setShowInstantResult(true)
        } else {
          setAlertaBonito({
            tipo: 'sucesso',
            titulo: 'Aposta Registrada!',
            mensagem: 'Sua aposta foi registrada com sucesso. Boa sorte!',
          })
        }
        // Resetar dados após sucesso
        setBetData(INITIAL_BET_DATA)
        setCurrentStep(1)
      })
      .catch((err) => {
        const msg = err.message || 'Erro ao registrar aposta'
        if (msg.toLowerCase().includes('saldo insuficiente')) {
          setAlertaBonito({
            tipo: 'erro',
            titulo: 'Saldo Insuficiente',
            mensagem: 'Verifique seu saldo e bônus disponíveis antes de apostar.',
          })
        } else {
          setAlertaBonito({
            tipo: 'erro',
            titulo: 'Erro ao Registrar Aposta',
            mensagem: msg,
          })
        }
      })
  }

  const handleConfirmCotacao = () => {
    setShowCotacaoAlerta(false)
    if (pendingPayload) {
      submitBet(pendingPayload)
      setPendingPayload(null)
    }
  }

  const handleCancelCotacao = () => {
    setShowCotacaoAlerta(false)
    setCotacaoAlerta(null)
    setPendingPayload(null)
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            {/* Tabs */}
            <div className="mb-6 flex gap-4 border-b border-gray-200">
              <button
                onClick={() => setActiveTab('bicho')}
                className={`flex items-center gap-2 border-b-2 pb-2 px-4 font-semibold transition-colors ${
                  activeTab === 'bicho'
                    ? 'border-blue text-blue'
                    : 'border-transparent text-gray-600 hover:text-blue'
                }`}
              >
                <span className="iconify i-fluent:animal-rabbit-20-regular"></span>
                Bicho
              </button>
              <button
                onClick={() => setActiveTab('loteria')}
                className={`flex items-center gap-2 border-b-2 pb-2 px-4 font-semibold transition-colors ${
                  activeTab === 'loteria'
                    ? 'border-blue text-blue'
                    : 'border-transparent text-gray-600 hover:text-blue'
                }`}
              >
                <span className="iconify i-fluent:ticket-diagonal-16-regular"></span>
                Loterias
              </button>
            </div>

            {activeTab === 'bicho' ? (
              <ModalitySelection
                selectedModality={betData.modality}
                onModalitySelect={(modalityId, modalityName) =>
                  setBetData((prev) => ({
                    ...prev,
                    modality: modalityId,
                    modalityName,
                    animalBets: [], // limpa palpites ao trocar modalidade
                    numberBets: [], // limpa palpites numéricos ao trocar modalidade
                  }))
                }
                onSpecialQuotationsClick={() => setShowSpecialModal(true)}
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <span className="iconify i-fluent:ticket-diagonal-16-regular text-6xl text-gray-400 mb-4"></span>
                <p className="text-gray-600">Seção de Loterias em desenvolvimento</p>
              </div>
            )}
          </div>
        )

      case 2:
        return isNumberModality ? (
          <NumberCalculator
            numberBets={betData.numberBets}
            modalityName={betData.modalityName || ''}
            maxPalpites={MAX_PALPITES}
            onAddBet={handleAddNumberBet}
            onRemoveBet={handleRemoveNumberBet}
          />
        ) : (
          <AnimalSelection
            animalBets={betData.animalBets}
            requiredPerBet={requiredAnimalsPerBet}
            maxPalpites={MAX_PALPITES}
            onAddBet={handleAddAnimalBet}
            onRemoveBet={handleRemoveAnimalBet}
          />
        )

      case 3:
        return (
          <PositionAmountDivision
            position={betData.position}
            customPosition={betData.customPosition}
            customPositionValue={betData.customPositionValue}
            amount={betData.amount}
            divisionType={betData.divisionType}
            useBonus={betData.useBonus}
            bonusAmount={betData.bonusAmount}
            onPositionChange={(pos) => setBetData((prev) => ({ ...prev, position: pos, customPosition: false }))}
            onCustomPositionChange={(checked) =>
              setBetData((prev) => ({ ...prev, customPosition: checked, position: checked ? null : prev.position }))
            }
            onCustomPositionValueChange={(value) =>
              setBetData((prev) => ({ ...prev, customPositionValue: value }))
            }
            onAmountChange={(amount) => setBetData((prev) => ({ ...prev, amount }))}
            onDivisionTypeChange={(type) => setBetData((prev) => ({ ...prev, divisionType: type }))}
            onBonusToggle={(use) => setBetData((prev) => ({ ...prev, useBonus: use }))}
          />
        )

      case 4:
        return (
          <LocationSelection
            instant={betData.instant}
            location={betData.location}
            specialTime={betData.specialTime}
            onInstantChange={(checked) => setBetData((prev) => ({ ...prev, instant: checked }))}
            onLocationChange={(loc) => setBetData((prev) => ({ ...prev, location: loc }))}
            onSpecialTimeChange={(time) => setBetData((prev) => ({ ...prev, specialTime: time }))}
          />
        )

      case 5:
        return (
          <BetConfirmation betData={betData} onConfirm={handleConfirm} onBack={handleBack} />
        )

      default:
        return null
    }
  }

  return (
    <div>
      {/* Progress Indicator */}
      <ProgressIndicator currentStep={currentStep} />

      {/* Special Quotations Modal */}
      <SpecialQuotationsModal
        isOpen={showSpecialModal}
        onClose={() => setShowSpecialModal(false)}
      />

      {/* Step Content */}
      <div className="mb-6">{renderStep()}</div>

      {/* Aviso de login necessário a partir da etapa 3 */}
      {isAuthenticated === false && currentStep >= 2 && (
        <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Para avançar para a etapa 3 você precisa fazer login (usa o saldo da carteira).
        </div>
      )}

      {/* Navigation Buttons */}
      {currentStep < 5 && (
        <div className="flex gap-4">
          {currentStep > 1 && (
            <button
              onClick={handleBack}
              className="flex-1 rounded-lg border-2 border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Voltar
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={
              (currentStep === 1 && !betData.modality && activeTab === 'bicho') ||
              (currentStep === 2 && !step2Valid) ||
              (currentStep >= 2 && isAuthenticated === false) ||
              (currentStep === 3 && !betData.customPosition && !betData.position) ||
              (currentStep === 3 && betData.customPosition && (!betData.customPositionValue || betData.customPositionValue.trim() === ''))
            }
            className="flex-1 rounded-lg bg-yellow px-6 py-3 font-bold text-blue-950 hover:bg-yellow/90 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          >
            Continuar
          </button>
        </div>
      )}

      {/* Modal de resultado instantâneo */}
      <InstantResultModal
        open={showInstantResult}
        onClose={() => {
          setShowInstantResult(false)
          setInstantResult(null)
        }}
        resultado={instantResult}
      />

      {/* Modal de alerta de cotação */}
      {cotacaoAlerta && (
        <CotacaoAlertaModal
          isOpen={showCotacaoAlerta}
          onClose={handleCancelCotacao}
          onConfirm={handleConfirmCotacao}
          tipo={cotacaoAlerta.tipo}
          numero={cotacaoAlerta.numero}
          cotacao={cotacaoAlerta.cotacao}
        />
      )}

      {/* Alerta bonito genérico */}
      {alertaBonito && (
        <AlertaBonito
          isOpen={!!alertaBonito}
          onClose={() => setAlertaBonito(null)}
          tipo={alertaBonito.tipo}
          titulo={alertaBonito.titulo}
          mensagem={alertaBonito.mensagem}
        />
      )}
    </div>
  )
}

function getRequiredAnimalsPerBet(modalityIdOrName: string | null): number {
  if (!modalityIdOrName) return 1

  const norm = (str: string) =>
    str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()

  const normalized = norm(modalityIdOrName)

  // Prioriza nome
  if (normalized.includes('dupla de grupo') || normalized === 'dupla') return 2
  if (normalized.includes('terno de grupo') || normalized === 'terno') return 3
  if (normalized.includes('quadra de grupo') || normalized === 'quadra') return 4
  if (normalized.includes('quina de grupo') || normalized === 'quina') return 5
  if (normalized === 'passe vai e vem') return 2
  if (normalized === 'passe vai') return 2

  // Fallback por ID conhecido
  const idNum = Number(modalityIdOrName)
  if (!Number.isNaN(idNum)) {
    if (idNum === 2) return 2 // Dupla de Grupo
    if (idNum === 3) return 3 // Terno de Grupo
    if (idNum === 4) return 4 // Quadra de Grupo
    if (idNum === 5) return 5 // Quina de Grupo
  }

  return 1 // Grupo simples ou outras
}
