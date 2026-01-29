'use client'

import { useEffect, useState } from 'react'
import { ANIMALS } from '@/data/animals'
import { MODALITIES } from '@/data/modalities'
import { BetData } from '@/types/bet'

interface BetConfirmationProps {
  betData: BetData
  onConfirm: () => void
  onBack: () => void
}

export default function BetConfirmation({ betData, onConfirm, onBack }: BetConfirmationProps) {
  const selectedGroups = betData.animalBets || []
  const flatSelectedIds = selectedGroups.flat()
  const selectedAnimals = ANIMALS.filter((animal) => flatSelectedIds.includes(animal.id))
  const [retornoMinimo, setRetornoMinimo] = useState<number | undefined>((betData.detalhes as any)?.retornoMinimo)
  const [retornoMaximo, setRetornoMaximo] = useState<number | undefined>((betData.detalhes as any)?.retornoMaximo)

  // Calcular retorno se ainda não foi calculado
  useEffect(() => {
    const calcularRetorno = async () => {
      // Se já tem valores calculados, usar eles
      if ((betData.detalhes as any)?.retornoMinimo !== undefined) {
        setRetornoMinimo((betData.detalhes as any)?.retornoMinimo)
        setRetornoMaximo((betData.detalhes as any)?.retornoMaximo)
        return
      }

      // Se não tem posição ou modalidade, não calcular
      if (!betData.position || !betData.modality) return

      // Primeiro, determinar o tipo de modalidade baseado no nome
      // Isso precisa ser feito ANTES de verificar palpites
      const modalityNameForCheck = betData.modalityName || ''
      const isNumberModalityCheck = modalityNameForCheck && (
        modalityNameForCheck.includes('Milhar') || 
        modalityNameForCheck.includes('Centena') || 
        modalityNameForCheck.includes('Dezena') ||
        modalityNameForCheck.includes('Invertida') ||
        modalityNameForCheck.includes('Duque') ||
        modalityNameForCheck.includes('Terno') ||
        modalityNameForCheck.includes('Quadra') ||
        modalityNameForCheck.includes('Quina') ||
        modalityNameForCheck.includes('Dezeninha')
      ) && !modalityNameForCheck.includes('Grupo') // Excluir modalidades de grupo
      
      // Verificar se tem palpites baseado no tipo de modalidade
      const hasPalpites = isNumberModalityCheck
        ? betData.numberBets.length > 0 
        : betData.animalBets.length > 0
      
      if (!hasPalpites) {
        // Sem palpites, não calcular retorno
        setRetornoMinimo(0)
        setRetornoMaximo(0)
        return
      }

      try {
        // Parsear posição
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

        // Mapear modalidade
        const modalityMap: Record<string, string> = {
          'Grupo': 'GRUPO',
          'Dupla de Grupo': 'DUPLA_GRUPO',
          'Terno de Grupo': 'TERNO_GRUPO',
          'Quadra de Grupo': 'QUADRA_GRUPO',
          'Quina de Grupo': 'QUINA_GRUPO',
          'Terno de Grupo Seco': 'TERNO_GRUPO_SECO',
          'Dezena': 'DEZENA',
          'Centena': 'CENTENA',
          'Milhar': 'MILHAR',
          'Dezena Invertida': 'DEZENA_INVERTIDA',
          'Centena Invertida': 'CENTENA_INVERTIDA',
          'Milhar Invertida': 'MILHAR_INVERTIDA',
          'Milhar/Centena': 'MILHAR_CENTENA',
          'Milhar Centena': 'MILHAR_CENTENA',
          'Passe vai': 'PASSE',
          'Passe vai e vem': 'PASSE_VAI_E_VEM',
          'Passe Vai e Vem': 'PASSE_VAI_E_VEM',
          'Duque de Dezena': 'DUQUE_DEZENA',
          'Terno de Dezena': 'TERNO_DEZENA',
          'Quadra de Dezena': 'QUADRA_DEZENA',
          'Duque de Dezena (EMD)': 'DUQUE_DEZENA_EMD',
          'Duque de Dezena EMD': 'DUQUE_DEZENA_EMD',
          'Terno de Dezena (EMD)': 'TERNO_DEZENA_EMD',
          'Terno de Dezena EMD': 'TERNO_DEZENA_EMD',
          'Dezeninha': 'DEZENINHA',
        }
        
        // Priorizar modalityName se disponível (mais confiável), senão buscar pelo ID
        let modalityName = betData.modalityName || ''
        
        // Se não tem modalityName, buscar pelo ID no array estático
        if (!modalityName && betData.modality) {
          const foundModality = MODALITIES.find(m => m.id.toString() === betData.modality)
          modalityName = foundModality?.name || ''
        }
        
        // Se ainda não encontrou, tentar buscar no array estático por nome similar
        if (!modalityName && betData.modality) {
          console.warn('⚠️ Modalidade não encontrada pelo ID:', {
            modalityId: betData.modality,
            modalityNameFromData: betData.modalityName,
            availableIds: MODALITIES.map(m => `${m.id}: ${m.name}`),
          })
        }
        
        let modalityType = modalityMap[modalityName]
        
        // Se não encontrou no map, determinar pelo tipo de modalidade
        if (!modalityType) {
          if (isNumberModalityCheck) {
            // Se é numérica mas não encontrou no map, tentar inferir pelo nome
            if (modalityName.includes('Milhar Invertida')) {
              modalityType = 'MILHAR_INVERTIDA'
            } else if (modalityName.includes('Centena Invertida')) {
              modalityType = 'CENTENA_INVERTIDA'
            } else if (modalityName.includes('Dezena Invertida')) {
              modalityType = 'DEZENA_INVERTIDA'
            } else if (modalityName.includes('Milhar/Centena') || modalityName.includes('Milhar Centena')) {
              modalityType = 'MILHAR_CENTENA'
            } else {
              modalityType = 'MILHAR' // Fallback seguro para modalidades numéricas
            }
            console.warn('⚠️ Modalidade não encontrada no map, inferindo tipo:', {
              modalityName,
              modalityType,
            })
          } else {
            modalityType = 'GRUPO' // Fallback para modalidades de grupo
          }
        }
        
        // Debug detalhado para modalidades invertidas
        if (modalityName.includes('Invertida') || modalityName.includes('Milhar/Centena')) {
          console.log('🔍 Debug Modalidade Especial:', {
            modalityId: betData.modality,
            modalityNameFromData: betData.modalityName,
            modalityNameFound: modalityName,
            modalityType,
            modalityMapKeys: Object.keys(modalityMap),
          })
        }
        // Determinar tipo de modalidade baseado no nome
        const isNumberModality = betData.modalityName && (
          betData.modalityName.includes('Milhar') || 
          betData.modalityName.includes('Centena') || 
          betData.modalityName.includes('Dezena') ||
          betData.modalityName.includes('Invertida') ||
          betData.modalityName.includes('Duque') ||
          betData.modalityName.includes('Terno') ||
          betData.modalityName.includes('Quadra') ||
          betData.modalityName.includes('Quina') ||
          betData.modalityName.includes('Dezeninha')
        )
        
        // Importar funções de cálculo primeiro (precisamos para calcular permutações)
        const betRulesEngine = await import('@/lib/bet-rules-engine')
        const { calcularValorPorPalpite, calcularNumero, calcularGrupo, contarPermutacoesDistintas } = betRulesEngine
        
        // Calcular quantidade de palpites baseado no tipo
        let qtdPalpites = 1
        if (isNumberModality) {
          if (betData.numberBets.length === 0) {
            // Sem número selecionado ainda, não calcular
            setRetornoMinimo(0)
            setRetornoMaximo(0)
            return
          }
          
          // Para modalidades invertidas, contar as permutações de cada número
          if (modalityType.includes('INVERTIDA')) {
            qtdPalpites = betData.numberBets.reduce((total, numero) => {
              return total + contarPermutacoesDistintas(numero)
            }, 0)
          } else if (modalityType === 'MILHAR_CENTENA') {
            // MILHAR_CENTENA: cada número gera 2 combinações (milhar + centena)
            qtdPalpites = betData.numberBets.length * 2
          } else {
            // Modalidades numéricas normais: 1 palpite por número
            qtdPalpites = betData.numberBets.length
          }
          
          if (qtdPalpites === 0) {
            setRetornoMinimo(0)
            setRetornoMaximo(0)
            return
          }
        } else {
          qtdPalpites = betData.animalBets.length || 0
          if (qtdPalpites === 0) {
            // Sem animais selecionados ainda, não calcular
            setRetornoMinimo(0)
            setRetornoMaximo(0)
            return
          }
        }
        
        // CÁLCULO CORRETO: O valor digitado é POR EXTRAÇÃO
        // Exemplo: R$ 2,00 por extração, 3 extrações = R$ 6,00 total debitado
        // Cada aposta salva: R$ 2,00 (valor por extração)
        // Para prêmio: R$ 2,00 / 3 palpites / 5 posições = valor por palpite por posição
        // Se ganhar: R$ 2,00 × cotação (20 para grupo) = R$ 40,00 por extração ganha
        const valorPorExtracao = betData.amount // Valor digitado é POR EXTRAÇÃO
        
        // Calcular valor por palpite usando o valor por extração
        // O valor por palpite será dividido pelas posições no cálculo do prêmio
        const valorPorPalpite = calcularValorPorPalpite(
          valorPorExtracao, // Usar valor por extração
          qtdPalpites,
          betData.divisionType
        )
        
        // Debug para modalidades invertidas
        if (modalityType.includes('INVERTIDA') && betData.numberBets.length > 0) {
          const permutacoesPorNumero = betData.numberBets.map(num => ({
            numero: num,
            permutacoes: contarPermutacoesDistintas(num)
          }))
          console.log('🔍 Debug Modalidade Invertida:', {
            modalityName,
            modalityType,
            numerosSelecionados: betData.numberBets,
            permutacoesPorNumero,
            qtdPalpitesTotal: qtdPalpites,
            valorPorExtracao,
            valorPorPalpite,
            divisionType: betData.divisionType,
          })
        }

        // Buscar odd do banco primeiro (se admin alterou), senão usa hardcoded
        const buscarOddFn = betRulesEngine.buscarOdd as any
        const odd = await buscarOddFn(
          modalityType as any, 
          pos_from, 
          pos_to,
          betData.modality ? parseInt(betData.modality) : undefined,
          modalityName || undefined
        )
        
        // Debug para verificar se está buscando do banco
        console.log('🔍 Debug Buscar Odd:', {
          modalityType,
          modalityId: betData.modality,
          modalityName,
          pos_from,
          pos_to,
          oddRetornado: odd,
        })
        
        let calculation: any
        
        // Verificar novamente antes de calcular (segurança extra)
        // Se é modalidade numérica (incluindo invertidas), deve ter numberBets
        const isActuallyNumberModality = modalityType === 'MILHAR' ||
                                         modalityType === 'CENTENA' ||
                                         modalityType === 'DEZENA' ||
                                         modalityType === 'MILHAR_INVERTIDA' ||
                                         modalityType === 'CENTENA_INVERTIDA' ||
                                         modalityType === 'DEZENA_INVERTIDA' ||
                                         modalityType === 'MILHAR_CENTENA' ||
                                         modalityType === 'DUQUE_DEZENA' ||
                                         modalityType === 'DUQUE_DEZENA_EMD' ||
                                         modalityType === 'TERNO_DEZENA' ||
                                         modalityType === 'TERNO_DEZENA_EMD' ||
                                         modalityType === 'QUADRA_DEZENA' ||
                                         modalityType === 'DEZENINHA'
        
        // Debug para verificar qual caminho está sendo tomado
        console.log('🔍 Debug Tipo de Modalidade:', {
          modalityType,
          modalityName,
          isActuallyNumberModality,
          isNumberModalityCheck,
          hasNumberBets: betData.numberBets.length > 0,
          hasAnimalBets: betData.animalBets.length > 0,
        })
        
        if (!isActuallyNumberModality && (modalityType.includes('GRUPO') || modalityType === 'PASSE' || modalityType === 'PASSE_VAI_E_VEM')) {
          // Modalidades de grupo requerem animais selecionados
          if (betData.animalBets.length === 0 || betData.animalBets[0]?.length === 0) {
            console.warn('⚠️ Modalidade de grupo sem animais selecionados', {
              modalityType,
              modalityName,
              animalBets: betData.animalBets,
            })
            setRetornoMinimo(0)
            setRetornoMaximo(0)
            return
          }
          const qtdGrupos = betData.animalBets[0]?.length || 0
          calculation = calcularGrupo(modalityType as any, qtdGrupos, pos_from, pos_to, valorPorPalpite)
        } else {
          // Para modalidades numéricas, requer número selecionado
          if (betData.numberBets.length === 0 || !betData.numberBets[0]) {
            console.warn('⚠️ Modalidade numérica sem número selecionado', {
              modalityType,
              modalityName,
              numberBets: betData.numberBets,
              isNumberModalityCheck,
            })
            setRetornoMinimo(0)
            setRetornoMaximo(0)
            return
          }
          
          // Usar o primeiro número apostado
          const numeroExemplo = betData.numberBets[0]
          calculation = calcularNumero(modalityType as any, numeroExemplo, pos_from, pos_to, valorPorPalpite)
          
          // Debug detalhado para modalidades invertidas
          if (modalityType.includes('INVERTIDA')) {
            console.log('🔍 Debug Cálculo Invertida:', {
              modalityType,
              numeroExemplo,
              valorPorPalpite,
              combinations: calculation.combinations,
              unitValue: calculation.unitValue,
              odd,
              premioUnidade: odd * calculation.unitValue,
            })
          }
        }

        const premioUnidade = odd * calculation.unitValue
        const qtdPosicoes = calculation.positions
        const minimo = premioUnidade * 1
        const maximo = premioUnidade * qtdPosicoes

        // Debug final (sempre logar para Milhar Invertida)
        if (modalityType === 'MILHAR_INVERTIDA' || modalityType.includes('INVERTIDA')) {
          console.log('🔍 Debug Retorno Final:', {
            modalityType,
            odd,
            calculationUnitValue: calculation.unitValue,
            premioUnidade,
            minimo,
            maximo,
            qtdPosicoes,
            valorPorPalpite,
            combinations: calculation.combinations,
          })
        }
        
        // Se o retorno está zerado, logar para debug
        if (minimo === 0 || maximo === 0) {
          console.warn('⚠️ Retorno previsto está zerado!', {
            modalityType,
            odd,
            calculationUnitValue: calculation.unitValue,
            premioUnidade,
            minimo,
            maximo,
            qtdPosicoes,
            valorPorPalpite,
            calculation,
          })
        }

        setRetornoMinimo(minimo)
        setRetornoMaximo(maximo)
      } catch (error) {
        console.error('Erro ao calcular retorno:', error)
      }
    }

    calcularRetorno()
  }, [betData.position, betData.modality, betData.animalBets.length, betData.numberBets.length, betData.amount, betData.divisionType, betData.customPosition, betData.customPositionValue])

  const calculateTotal = () => {
    // O valor total já é o valor completo (será dividido entre as extrações)
    let total = betData.amount
    if (betData.divisionType === 'each') {
      total = total * selectedGroups.length
    }
    if (betData.useBonus && betData.bonusAmount > 0) {
      total = Math.max(0, total - betData.bonusAmount)
    }
    return total
  }

  const total = calculateTotal()
  
  // Calcular valor por extração se houver múltiplas selecionadas
  const qtdExtracoesSelecionadas = betData.selectedExtracoes?.length || 0
  // O valor digitado é POR EXTRAÇÃO, não precisa dividir
  const valorPorExtracao = betData.amount

  // Buscar modalidade do banco de dados para pegar a cotação atualizada
  const [selectedModality, setSelectedModality] = useState<{ id: number; name: string; value: string; hasLink: boolean } | null>(null)

  useEffect(() => {
    const loadModalityFromDB = async () => {
      try {
        if (betData.modality) {
          // Buscar modalidade do banco pelo ID (prioridade)
          const response = await fetch(`/api/modalidades?t=${Date.now()}`, {
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
            },
          })
          const data = await response.json()
          
          if (data.modalidades && data.modalidades.length > 0) {
            const modalityFromDB = data.modalidades.find(
              (m: any) => m.id.toString() === betData.modality
            )
            
            if (modalityFromDB) {
              console.log('✅ Modalidade encontrada no banco:', {
                id: modalityFromDB.id,
                name: modalityFromDB.name,
                value: modalityFromDB.value,
              })
              setSelectedModality({
                id: modalityFromDB.id,
                name: modalityFromDB.name,
                value: modalityFromDB.value || '1x R$ 0.00',
                hasLink: modalityFromDB.hasLink || false,
              })
              return
            } else {
              console.warn('⚠️ Modalidade não encontrada no banco pelo ID:', {
                modalityId: betData.modality,
                modalidadesDisponiveis: data.modalidades?.map((m: any) => `${m.id}: ${m.name}`),
              })
            }
          }
        }
        
        // Fallback: buscar do array estático se não encontrar no banco
        if (betData.modalityName) {
          const modalityFromStatic = MODALITIES.find((m) => m.name === betData.modalityName)
          if (modalityFromStatic) {
            setSelectedModality({
              id: modalityFromStatic.id,
              name: modalityFromStatic.name,
              value: modalityFromStatic.value,
              hasLink: modalityFromStatic.hasLink || false,
            })
            return
          }
        }
        
        if (betData.modality) {
          const modalityFromStatic = MODALITIES.find((m) => m.id.toString() === betData.modality)
          if (modalityFromStatic) {
            setSelectedModality({
              id: modalityFromStatic.id,
              name: modalityFromStatic.name,
              value: modalityFromStatic.value,
              hasLink: modalityFromStatic.hasLink || false,
            })
            return
          }
        }
        
        // Último fallback: criar objeto com dados do betData
        if (betData.modalityName) {
          setSelectedModality({
            id: parseInt(betData.modality || '0'),
            name: betData.modalityName,
            value: '1x R$ 0.00',
            hasLink: false,
          })
        }
      } catch (error) {
        console.error('Erro ao carregar modalidade do banco:', error)
        // Fallback para array estático em caso de erro
        if (betData.modalityName) {
          const modalityFromStatic = MODALITIES.find((m) => m.name === betData.modalityName)
          if (modalityFromStatic) {
            setSelectedModality({
              id: modalityFromStatic.id,
              name: modalityFromStatic.name,
              value: modalityFromStatic.value,
              hasLink: modalityFromStatic.hasLink || false,
            })
          }
        } else if (betData.modality) {
          const modalityFromStatic = MODALITIES.find((m) => m.id.toString() === betData.modality)
          if (modalityFromStatic) {
            setSelectedModality({
              id: modalityFromStatic.id,
              name: modalityFromStatic.name,
              value: modalityFromStatic.value,
              hasLink: modalityFromStatic.hasLink || false,
            })
          }
        }
      }
    }
    
    loadModalityFromDB()
  }, [betData.modality, betData.modalityName])

  return (
    <div>
      <h2 className="mb-6 text-xl font-bold text-gray-950">Confirmação da Aposta</h2>

      <div className="space-y-6 rounded-lg border-2 border-gray-200 bg-white p-6">
        {/* Modality */}
        {selectedModality && (
          <div>
            <h3 className="mb-2 font-semibold text-gray-700">Modalidade:</h3>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-gray-950">{selectedModality.name}</span>
              <span className="font-bold text-blue">{selectedModality.value}</span>
            </div>
          </div>
        )}

        {/* Animals */}
        <div>
          <h3 className="mb-2 font-semibold text-gray-700">Palpites de animais:</h3>
          <div className="space-y-2">
            {selectedGroups.map((grp, idx) => (
              <div key={idx} className="flex flex-wrap gap-2">
                <span className="rounded-lg bg-amber-200 px-3 py-1 text-sm font-semibold text-gray-900">
                  {grp.map((n) => String(n).padStart(2, '0')).join('-')}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Position */}
        {betData.position && (
          <div>
            <h3 className="mb-2 font-semibold text-gray-700">Posição:</h3>
            <p className="text-gray-950">{betData.position}</p>
            {betData.customPosition && (
              <p className="text-sm text-gray-500">(Personalizado)</p>
            )}
          </div>
        )}

        {/* Amount */}
        <div>
          <h3 className="mb-2 font-semibold text-gray-700">Valor:</h3>
          {qtdExtracoesSelecionadas > 1 ? (
            <div className="space-y-1">
              <p className="text-lg font-bold text-gray-950">
                R$ {betData.amount.toFixed(2)} por extração × {qtdExtracoesSelecionadas} extrações = R$ {(betData.amount * qtdExtracoesSelecionadas).toFixed(2)} total
              </p>
            </div>
          ) : (
            <p className="text-lg font-bold text-gray-950">
              R$ {betData.amount.toFixed(2)} {betData.divisionType === 'each' ? 'por palpite' : 'por extração'}
            </p>
          )}
        </div>

        {/* Division */}
        <div>
          <h3 className="mb-2 font-semibold text-gray-700">Divisão:</h3>
          <p className="text-gray-950">
            {betData.divisionType === 'all' ? 'Para todo o palpite' : 'Para cada palpite'}
          </p>
        </div>

        {/* Selected Extrações */}
        {betData.selectedExtracoes && betData.selectedExtracoes.length > 0 ? (() => {
          const selectedExtracoes = betData.selectedExtracoes!
          const qtdExtracoes = selectedExtracoes.length
          return (
            <div>
              <h3 className="mb-2 font-semibold text-gray-700">Extrações Selecionadas ({qtdExtracoes}):</h3>
              <div className="space-y-2">
                {selectedExtracoes.map((extId, idx) => {
                  // O valor digitado é POR EXTRAÇÃO, então cada extração tem o valor completo
                  return (
                    <div key={extId} className="rounded-lg bg-blue/5 border border-blue/20 p-3">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-950">Extração #{extId}</span>
                        <span className="text-sm font-bold text-blue">R$ {betData.amount.toFixed(2)}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
              <p className="mt-2 text-xs text-gray-600">
                Valor de R$ {betData.amount.toFixed(2)} por extração × {qtdExtracoes} extração(ões) = R$ {(betData.amount * qtdExtracoes).toFixed(2)} total
              </p>
            </div>
          )
        })() : betData.location ? (
          <div>
            <h3 className="mb-2 font-semibold text-gray-700">Localização:</h3>
            <p className="text-gray-950">{betData.location}</p>
          </div>
        ) : null}

        {/* Instant */}
        {betData.instant && (
          <div>
            <p className="font-semibold text-yellow">✓ Sorteio Instantâneo</p>
          </div>
        )}

        {/* Bonus */}
        {betData.useBonus && betData.bonusAmount > 0 && (
          <div className="rounded-lg bg-yellow/10 p-3">
            <p className="font-semibold text-gray-950">
              Bônus aplicado: -R$ {betData.bonusAmount.toFixed(2)}
            </p>
          </div>
        )}

        {/* Retorno Previsto */}
        {(retornoMinimo !== undefined || retornoMaximo !== undefined || betData.position) && (
          <div className="rounded-lg bg-blue/10 p-4 border-2 border-blue/20">
            <h3 className="mb-3 text-lg font-bold text-gray-900">💰 Retorno Previsto por Palpite:</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between rounded-lg bg-white/50 px-3 py-2">
                <span className="text-sm font-semibold text-gray-700">Mínimo possível:</span>
                <span className="text-lg font-bold text-gray-900">
                  R$ {Number(retornoMinimo || 0).toFixed(2)}
                </span>
              </div>
              {retornoMaximo !== undefined && 
               retornoMaximo !== retornoMinimo && (
                <div className="flex items-center justify-between rounded-lg bg-green-50 px-3 py-2 border border-green-200">
                  <span className="text-sm font-semibold text-gray-700">Máximo possível:</span>
                  <span className="text-lg font-bold text-green-700">
                    R$ {Number(retornoMaximo || 0).toFixed(2)}
                  </span>
                </div>
              )}
            </div>
            <p className="mt-3 text-xs text-gray-600 italic">
              💡 O retorno por palpite varia conforme quantas posições ele acertar (1 até todas as posições)
            </p>
          </div>
        )}

        {/* Total */}
        <div className="border-t-2 border-gray-200 pt-4">
          <div className="flex items-center justify-between">
            <span className="text-xl font-bold text-gray-950">Total a Pagar:</span>
            <span className="text-2xl font-extrabold text-blue">R$ {total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="mt-6 flex gap-4">
        <button
          onClick={onBack}
          className="flex-1 rounded-lg border-2 border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Voltar
        </button>
        <button
          onClick={onConfirm}
          className="flex-1 rounded-lg bg-yellow px-6 py-3 font-bold text-blue-950 hover:bg-yellow/90 transition-colors"
        >
          Confirmar Aposta
        </button>
      </div>
    </div>
  )
}
