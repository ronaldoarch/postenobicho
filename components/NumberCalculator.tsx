'use client'

import { useEffect, useState } from 'react'

interface NumberCalculatorProps {
  numberBets: string[]
  modalityName: string
  maxPalpites: number
  onAddBet: (number: string) => void
  onRemoveBet: (index: number) => void
}

const MODALITY_DIGITS: Record<string, number> = {
  'Dezena': 2,
  'Centena': 3,
  'Milhar': 4,
  'Dezena Invertida': 2,
  'Centena Invertida': 3,
  'Milhar Invertida': 4,
  'Milhar/Centena': 4, // Aceita 3 ou 4 dígitos
  'Milhar Centena': 4, // Aceita 3 ou 4 dígitos
  'Duque de Dezena': 2,
  'Terno de Dezena': 2,
  'Terno de Dezena Seco': 2, // Similar a Terno de Dezena
  'Quadra de Dezena': 2, // Cada dezena tem 2 dígitos, mas precisa de 4 dezenas
  'Duque de Dezena EMD': 4, // Milhar de 4 dígitos, extrai 3 dezenas, escolhe 2
  'Terno de Dezena EMD': 4, // Milhar de 4 dígitos, extrai 3 dezenas automaticamente
  'Duque de Dezena (EMD)': 4, // Alias para Duque de Dezena EMD
  'Terno de Dezena (EMD)': 4, // Alias para Terno de Dezena EMD
  'Dezeninha': 0, // Especial: aceita 3, 4 ou 5 dezenas separadas por vírgula/espaço
}

/**
 * Extrai as 3 dezenas possíveis de um milhar usando EMD (Esquerda, Meio, Direita).
 * Exemplo: 1234 → [12, 23, 34]
 */
function extrairDezenasEMD(milhar: string): string[] {
  const milharStr = milhar.padStart(4, '0')
  const esquerda = milharStr.slice(0, 2) // Primeiros 2 dígitos
  const meio = milharStr.slice(1, 3) // Dígitos do meio
  const direita = milharStr.slice(2, 4) // Últimos 2 dígitos
  return [esquerda, meio, direita]
}

export default function NumberCalculator({
  numberBets,
  modalityName,
  maxPalpites,
  onAddBet,
  onRemoveBet,
}: NumberCalculatorProps) {
  const [currentNumber, setCurrentNumber] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [selectedEMD, setSelectedEMD] = useState<string[]>([]) // Para Duque EMD: seleciona 2 de 3

  const isMilharCentena = modalityName === 'Milhar/Centena' || modalityName === 'Milhar Centena'
  const isDuqueEMD = modalityName === 'Duque de Dezena EMD' || modalityName === 'Duque de Dezena (EMD)'
  const isTernoEMD = modalityName === 'Terno de Dezena EMD' || modalityName === 'Terno de Dezena (EMD)'
  const isQuadraDezena = modalityName === 'Quadra de Dezena'
  const isTernoDezenaSeco = modalityName === 'Terno de Dezena Seco'
  const isDezeninha = modalityName === 'Dezeninha'

  const maxDigits = MODALITY_DIGITS[modalityName] || 4
  const maxReached = numberBets.length >= maxPalpites

  useEffect(() => {
    setCurrentNumber('')
    setSelectedEMD([])
    setError(null)
  }, [modalityName])

  // Função para validar e formatar dezenas para Dezeninha
  const parseDezeninha = (input: string): string[] => {
    return input
      .split(/[,\s]+/)
      .map(d => d.trim())
      .filter(d => d.length > 0)
      .map(d => d.padStart(2, '0'))
  }

  const handleNumberClick = (digit: string) => {
    if (maxReached && currentNumber.length === 0) return

    setError(null)
    const newNumber = currentNumber + digit

    // Validação especial para Dezeninha (3 a 20 dezenas separadas por vírgula/espaço)
    if (isDezeninha) {
      const dezenas = parseDezeninha(newNumber)
      if (dezenas.length > 20) {
        setError('Máximo de 20 dezenas')
        return
      }
      // Valida cada dezena (deve ter 2 dígitos)
      for (const dezena of dezenas) {
        if (dezena.length > 2) {
          setError('Cada dezena deve ter 2 dígitos')
          return
        }
      }
      // Auto-confirma quando tem pelo menos 3 dezenas completas (até 20)
      if (dezenas.length >= 3 && dezenas.length <= 20 && dezenas.every(d => d.length === 2)) {
        const formatted = dezenas.join(',')
        handleConfirm(formatted)
        return
      }
      setCurrentNumber(newNumber)
      return
    }

    // Validação especial para Quadra de Dezena (4 dezenas de 2 dígitos cada)
    if (isQuadraDezena) {
      // Formato: "12-23-34-45" ou "12 23 34 45"
      const parts = newNumber.replace(/[-\s]/g, '').match(/.{1,2}/g) || []
      if (parts.length > 4) {
        setError('Máximo de 4 dezenas')
        return
      }
      if (parts.length === 4 && parts.every(p => p.length === 2)) {
        // Todas as 4 dezenas completas
        const formatted = parts.map(p => p.padStart(2, '0')).join('-')
        handleConfirm(formatted)
        return
      }
      setCurrentNumber(newNumber)
      return
    }

    // Validação para EMD
    if (isDuqueEMD || isTernoEMD) {
      if (newNumber.length > 4) {
        setError('Máximo de 4 dígitos para EMD')
        return
      }
      if (newNumber.length === 4) {
        // Extrai as 3 dezenas EMD
        const dezenasEMD = extrairDezenasEMD(newNumber)
        if (isTernoEMD) {
          // Terno EMD: usa as 3 dezenas automaticamente
          const formatted = dezenasEMD.join('-')
          handleConfirm(formatted)
          return
        } else if (isDuqueEMD) {
          // Duque EMD: mostra as 3 dezenas para o usuário escolher 2
          setSelectedEMD(dezenasEMD)
          setCurrentNumber('') // Limpa o número atual
          return
        }
      }
      setCurrentNumber(newNumber)
      return
    }

    // Validação normal
    if (isMilharCentena) {
      if (newNumber.length > 4) {
        setError('Máximo de 4 dígitos')
        return
      }
      // Auto-confirma quando atinge 3 ou 4 dígitos
      if (newNumber.length === 3 || newNumber.length === 4) {
        handleConfirm(newNumber.padStart(4, '0'))
        return
      }
    } else {
      if (newNumber.length > maxDigits) {
        setError(`Máximo de ${maxDigits} dígitos`)
        return
      }
      // Auto-confirma quando atinge o limite de dígitos
      if (newNumber.length === maxDigits) {
        handleConfirm(newNumber.padStart(maxDigits, '0'))
        return
      }
    }

    setCurrentNumber(newNumber)
  }

  const handleBackspace = () => {
    setError(null)
    setCurrentNumber((prev) => prev.slice(0, -1))
  }

  const handleClear = () => {
    setError(null)
    setCurrentNumber('')
    setSelectedEMD([])
  }

  const handleConfirm = (number?: string) => {
    const numToConfirm = number || currentNumber

    if (!numToConfirm) {
      setError('Digite um número')
      return
    }

    // Validação final para Dezeninha
    if (isDezeninha) {
      const dezenas = parseDezeninha(numToConfirm)
      if (dezenas.length < 3 || dezenas.length > 20) {
        setError('Dezeninha precisa de 3 a 20 dezenas')
        return
      }
      if (!dezenas.every(d => d.length === 2)) {
        setError('Cada dezena deve ter 2 dígitos')
        return
      }
      const formatted = dezenas.join(',')
      onAddBet(formatted)
      setCurrentNumber('')
      setError(null)
      return
    }

    // Validação final para Quadra de Dezena
    if (isQuadraDezena) {
      const parts = numToConfirm.replace(/[-\s]/g, '').match(/.{1,2}/g) || []
      if (parts.length !== 4 || !parts.every(p => p.length === 2)) {
        setError('Quadra de Dezena precisa de 4 dezenas de 2 dígitos')
        return
      }
      const formatted = parts.map(p => p.padStart(2, '0')).join('-')
      onAddBet(formatted)
      setCurrentNumber('')
      setError(null)
      return
    }

    if (isDuqueEMD && selectedEMD.length === 0) {
      setError('Selecione 2 dezenas EMD')
      return
    }

    if (isMilharCentena) {
      if (numToConfirm.length < 3 || numToConfirm.length > 4) {
        setError('Milhar/Centena precisa de 3 ou 4 dígitos')
        return
      }
      const formatted = numToConfirm.padStart(4, '0')
      onAddBet(formatted)
      setCurrentNumber('')
      setError(null)
      return
    }

    // Validação para Terno de Dezena Seco (similar a Terno de Dezena)
    if (isTernoDezenaSeco) {
      if (numToConfirm.length !== 2) {
        setError('Terno de Dezena Seco precisa de 2 dígitos')
        return
      }
      const formatted = numToConfirm.padStart(2, '0')
      onAddBet(formatted)
      setCurrentNumber('')
      setError(null)
      setSelectedEMD([])
      return
    }

    if (numToConfirm.length !== maxDigits) {
      setError(`${modalityName} precisa de exatamente ${maxDigits} dígitos`)
      return
    }

    const formatted = numToConfirm.padStart(maxDigits, '0')
    onAddBet(formatted)
    setCurrentNumber('')
    setError(null)
    setSelectedEMD([])
  }

  const handleSelectEMD = (dezena: string) => {
    if (selectedEMD.includes(dezena)) {
      // Remove se já está selecionada
      setSelectedEMD((prev) => prev.filter((d) => d !== dezena))
    } else {
      // Adiciona se não está selecionada (máximo 2)
      if (selectedEMD.length >= 2) {
        setError('Selecione apenas 2 dezenas')
        return
      }
      const newSelection = [...selectedEMD, dezena]
      setSelectedEMD(newSelection)
      // Auto-confirma quando seleciona 2 dezenas
      if (newSelection.length === 2) {
        const formatted = newSelection.sort().join('-')
        onAddBet(formatted)
        setSelectedEMD([])
        setError(null)
      }
    }
  }

  const formatDisplayNumber = () => {
    if (isQuadraDezena) {
      const parts = currentNumber.replace(/[-\s]/g, '').match(/.{1,2}/g) || []
      const formatted = parts.map(p => p.padStart(2, '0'))
      while (formatted.length < 4) {
        formatted.push('__')
      }
      return formatted.join('-')
    }
    return currentNumber.padEnd(maxDigits, '_').split('').join(' ')
  }

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-950">Números:</h2>
        <p className="text-gray-600">
          {isDezeninha
            ? `Digite de 3 a 20 dezenas de 2 dígitos cada, separadas por vírgula ou espaço (ex: 12,23,34 ou 12 23 34 45 56...)`
            : isQuadraDezena
              ? 'Digite 4 dezenas de 2 dígitos cada (ex: 12-23-34-45)'
              : isDuqueEMD
                ? 'Digite um milhar de 4 dígitos, depois selecione 2 das 3 dezenas EMD'
                : isTernoEMD
                  ? 'Digite um milhar de 4 dígitos (extrai automaticamente as 3 dezenas EMD)'
                  : isTernoDezenaSeco
                    ? `Digite 2 dígitos para a dezena (até ${maxPalpites} palpites)`
                    : isMilharCentena
                      ? `Digite 3 ou 4 dígitos (até ${maxPalpites} palpites)`
                      : `Digite ${maxDigits} dígitos (até ${maxPalpites} palpites)`}
        </p>
      </div>

      {/* Palpites já adicionados */}
      <div className="mb-4 flex flex-wrap gap-2">
        {numberBets.map((bet, idx) => (
          <span
            key={idx}
            className="flex items-center gap-2 rounded-lg bg-amber-400 px-3 py-2 text-base font-semibold text-gray-900 shadow"
          >
            {bet}
            <button
              onClick={() => onRemoveBet(idx)}
              className="text-gray-900 hover:text-gray-700"
              aria-label="Remover palpite"
            >
              <span className="iconify i-material-symbols:delete-outline text-lg"></span>
            </button>
          </span>
        ))}
      </div>

      {/* Seleção EMD para Duque EMD */}
      {isDuqueEMD && selectedEMD.length > 0 && (
        <div className="mb-4 rounded-lg border-2 border-blue bg-blue/5 p-4">
          <p className="mb-2 text-sm font-semibold text-gray-900">
            Selecione 2 das 3 dezenas EMD:
          </p>
          <div className="flex gap-2">
            {selectedEMD.map((dezena) => {
              const isSelected = selectedEMD.filter((d) => d === dezena).length > 0
              return (
                <button
                  key={dezena}
                  onClick={() => handleSelectEMD(dezena)}
                  className={`rounded-lg border-2 px-4 py-2 font-semibold transition-all ${
                    isSelected
                      ? 'border-blue bg-blue text-white'
                      : 'border-gray-300 bg-white text-gray-900 hover:border-blue'
                  }`}
                >
                  {dezena}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Display do número atual */}
      <div className="mb-4 rounded-lg border-2 border-gray-200 bg-gray-50 p-6 text-center">
        <div className="mb-2 text-sm text-gray-600">
          {isDezeninha
            ? `Digite 3-20 dezenas (${parseDezeninha(currentNumber).length} dezenas)`
            : isQuadraDezena
              ? 'Digite 4 dezenas'
              : isDuqueEMD || isTernoEMD
                ? 'Digite milhar (4 dígitos)'
                : `${currentNumber.length}/${maxDigits} dígitos`}
        </div>
        <div className="text-4xl font-bold text-blue">
          {selectedEMD.length > 0 ? selectedEMD.join(' | ') : formatDisplayNumber()}
        </div>
        {error && <div className="mt-2 text-sm text-red-600">{error}</div>}
      </div>

      {/* Teclado numérico */}
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((num) => (
          <button
            key={num}
            onClick={() => handleNumberClick(String(num))}
            disabled={maxReached && currentNumber.length === 0}
            className="rounded-lg border-2 border-gray-300 bg-white px-6 py-4 text-2xl font-bold text-gray-900 transition-all hover:border-blue hover:bg-blue/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {num}
          </button>
        ))}
        <button
          onClick={handleBackspace}
          className="rounded-lg border-2 border-gray-300 bg-gray-100 px-6 py-4 text-xl font-bold text-gray-900 transition-all hover:border-blue hover:bg-blue/10"
        >
          ⌫
        </button>
        <button
          onClick={handleClear}
          className="rounded-lg border-2 border-gray-300 bg-gray-100 px-6 py-4 text-sm font-bold text-gray-900 transition-all hover:border-blue hover:bg-blue/10"
        >
          Limpar
        </button>
        {!isDuqueEMD && (
          <button
            onClick={() => handleConfirm()}
            disabled={currentNumber.length === 0}
            className="rounded-lg border-2 border-blue bg-blue px-6 py-4 text-lg font-bold text-white transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Confirmar
          </button>
        )}
      </div>

      {/* Separador para Quadra de Dezena */}
      {isQuadraDezena && (
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => {
              const newNum = currentNumber + '-'
              if (newNum.split('-').length <= 4) {
                setCurrentNumber(newNum)
              }
            }}
            className="rounded-lg border-2 border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-900 transition-all hover:border-blue hover:bg-blue/10"
          >
            Adicionar Separador (-)
          </button>
        </div>
      )}
    </div>
  )
}
