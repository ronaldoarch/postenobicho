'use client'

import { useEffect } from 'react'

interface ConfirmacaoBonitaProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  titulo: string
  mensagem: string
  textoConfirmar?: string
  textoCancelar?: string
  tipo?: 'perigo' | 'aviso' | 'info'
}

export default function ConfirmacaoBonita({
  isOpen,
  onClose,
  onConfirm,
  titulo,
  mensagem,
  textoConfirmar = 'Confirmar',
  textoCancelar = 'Cancelar',
  tipo = 'aviso',
}: ConfirmacaoBonitaProps) {
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

  const cores = {
    perigo: {
      bg: 'bg-gradient-to-r from-[#FF4444] to-[#E63946]',
      icon: '⚠️',
      iconBg: 'bg-[#FF4444]',
      botaoConfirmar: 'bg-gradient-to-r from-[#FF4444] to-[#E63946] hover:from-[#E63946] hover:to-[#FF4444]',
    },
    aviso: {
      bg: 'bg-gradient-to-r from-[#FFD700] to-[#FFC107]',
      icon: '⚠️',
      iconBg: 'bg-[#FFD700]',
      botaoConfirmar: 'bg-gradient-to-r from-[#FFD700] to-[#FFC107] hover:from-[#FFC107] hover:to-[#FFD700]',
    },
    info: {
      bg: 'bg-gradient-to-r from-[#052370] to-[#0a3a9e]',
      icon: 'ℹ️',
      iconBg: 'bg-[#052370]',
      botaoConfirmar: 'bg-gradient-to-r from-[#052370] to-[#0a3a9e] hover:from-[#0a3a9e] hover:to-[#052370]',
    },
  }

  const cor = cores[tipo]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header com gradiente */}
        <div className={`${cor.bg} px-6 py-4`}>
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full ${cor.iconBg} flex items-center justify-center text-2xl`}>
              {cor.icon}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{titulo}</h2>
            </div>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="px-6 py-6">
          <p className="text-gray-700 mb-6 text-center">{mensagem}</p>

          {/* Botões */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
            >
              {textoCancelar}
            </button>
            <button
              onClick={() => {
                onConfirm()
                onClose()
              }}
              className={`flex-1 px-6 py-3 rounded-xl ${cor.botaoConfirmar} text-white font-semibold transition-all shadow-lg hover:shadow-xl`}
            >
              {textoConfirmar}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
