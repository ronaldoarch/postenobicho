'use client'

import { useEffect } from 'react'

interface CotacaoAlertaModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  tipo: 'milhar' | 'centena'
  numero: string
  cotacao: number | null
}

export default function CotacaoAlertaModal({
  isOpen,
  onClose,
  onConfirm,
  tipo,
  numero,
  cotacao,
}: CotacaoAlertaModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  const tipoTexto = tipo === 'milhar' ? 'Milhar' : 'Centena'
  const cotacaoTexto = cotacao !== null && cotacao > 0 
    ? `${cotacao}x` 
    : 'reduzida (1/6 do valor normal)'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header com gradiente azul */}
        <div className="bg-gradient-to-r from-[#052370] to-[#0a3a9e] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-yellow flex items-center justify-center text-2xl">
              ⚠️
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Atenção: {tipoTexto} Cotada</h2>
              <p className="text-sm text-white/80">Esta {tipo.toLowerCase()} possui cotação especial</p>
            </div>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="px-6 py-6">
          <div className="mb-6">
            <div className="bg-gradient-to-br from-yellow/20 to-yellow/10 rounded-xl p-4 border-2 border-yellow/30 mb-4">
              <div className="text-center">
                <div className="text-4xl font-bold text-[#052370] mb-2">{numero}</div>
                <div className="text-sm text-gray-600">Número apostado</div>
              </div>
            </div>

            <div className="bg-red-50 border-l-4 border-[#FF4444] rounded-r-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <div className="text-2xl">📉</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-[#FF4444] mb-1">Cotação Reduzida</h3>
                  <p className="text-sm text-gray-700">
                    Esta {tipo.toLowerCase()} está cotada e possui uma cotação{' '}
                    <strong className="text-[#052370]">{cotacaoTexto}</strong>.
                  </p>
                  {cotacao !== null && cotacao > 0 && (
                    <p className="text-xs text-gray-600 mt-2">
                      O prêmio será multiplicado por <strong>{cotacao}x</strong> ao invés da cotação normal.
                    </p>
                  )}
                  {cotacao === null && (
                    <p className="text-xs text-gray-600 mt-2">
                      O prêmio será reduzido para <strong>1/6 do valor normal</strong>.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-[#052370] text-center">
                <strong>Deseja continuar com esta aposta?</strong>
              </p>
            </div>
          </div>

          {/* Botões */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-[#052370] to-[#0a3a9e] text-white font-semibold hover:from-[#0a3a9e] hover:to-[#052370] transition-all shadow-lg hover:shadow-xl"
            >
              Confirmar Aposta
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
