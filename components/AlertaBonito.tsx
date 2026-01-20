'use client'

import { useEffect } from 'react'

interface AlertaBonitoProps {
  isOpen: boolean
  onClose: () => void
  tipo?: 'sucesso' | 'erro' | 'aviso' | 'info'
  titulo: string
  mensagem: string
  botaoTexto?: string
}

export default function AlertaBonito({
  isOpen,
  onClose,
  tipo = 'info',
  titulo,
  mensagem,
  botaoTexto = 'OK',
}: AlertaBonitoProps) {
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
    sucesso: {
      bg: 'bg-gradient-to-r from-[#25D366] to-[#20BA5A]',
      border: 'border-[#25D366]',
      icon: '✅',
      iconBg: 'bg-[#25D366]',
    },
    erro: {
      bg: 'bg-gradient-to-r from-[#FF4444] to-[#E63946]',
      border: 'border-[#FF4444]',
      icon: '❌',
      iconBg: 'bg-[#FF4444]',
    },
    aviso: {
      bg: 'bg-gradient-to-r from-[#FFD700] to-[#FFC107]',
      border: 'border-[#FFD700]',
      icon: '⚠️',
      iconBg: 'bg-[#FFD700]',
    },
    info: {
      bg: 'bg-gradient-to-r from-[#052370] to-[#0a3a9e]',
      border: 'border-[#052370]',
      icon: 'ℹ️',
      iconBg: 'bg-[#052370]',
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

          {/* Botão */}
          <button
            onClick={onClose}
            className={`w-full px-6 py-3 rounded-xl ${cor.bg} text-white font-semibold hover:opacity-90 transition-all shadow-lg hover:shadow-xl`}
          >
            {botaoTexto}
          </button>
        </div>
      </div>
    </div>
  )
}
