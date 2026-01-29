'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import ConfirmacaoBonita from './ConfirmacaoBonita'

interface ProfileModalProps {
  isOpen: boolean
  onClose: () => void
  user: {
    id: number
    nome: string
    email: string
    telefone: string | null
    saldo: number
    bonus: number
    bonusBloqueado: number
    bonusSemanal: number
  } | null
  onLogout: () => Promise<void> | void
}

export default function ProfileModal({ isOpen, onClose, user, onLogout }: ProfileModalProps) {
  const [showConfirmacao, setShowConfirmacao] = useState(false)
  const [userData, setUserData] = useState(user)
  
  // Atualizar userData quando user prop mudar
  useEffect(() => {
    setUserData(user)
  }, [user])
  
  // Atualizar dados do usuário quando o modal abrir ou quando receber evento de atualização
  useEffect(() => {
    if (isOpen && user) {
      const loadUserData = async () => {
        try {
          const res = await fetch('/api/auth/me', { cache: 'no-store' })
          if (res.ok) {
            const data = await res.json()
            if (data.user) {
              setUserData(data.user)
            }
          }
        } catch (e) {
          console.error('Erro ao carregar dados do usuário:', e)
        }
      }
      
      loadUserData()
      
      // Escutar eventos de atualização de saldo
      const handleSaldoUpdate = () => {
        loadUserData()
      }
      
      window.addEventListener('saldo-updated', handleSaldoUpdate)
      
      // Atualizar a cada 5 segundos quando o modal estiver aberto
      const interval = setInterval(loadUserData, 5000)
      
      return () => {
        window.removeEventListener('saldo-updated', handleSaldoUpdate)
        clearInterval(interval)
      }
    }
  }, [isOpen, user])
  
  // Usar userData se disponível, senão usar user prop
  const displayUser = userData || user

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

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  const handleLogout = async () => {
    setShowConfirmacao(true)
  }

  const confirmarLogout = async () => {
    try {
      await onLogout()
    } catch (error) {
      console.error('Erro no logout:', error)
    }
    onClose()
    // O redirecionamento já é feito no onLogout do Header
  }

  if (!isOpen) return null
  
  // Se não tem usuário, mostrar tela de login
  if (!user) {
    return (
      <div
        className="fixed inset-0 z-50 bg-transparent"
        onClick={onClose}
      >
        <div
          className="absolute right-4 top-16 w-full max-w-md rounded-2xl bg-blue p-6 shadow-2xl md:right-8 md:p-8"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Botão fechar */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-white hover:text-gray-300 transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
          <div className="py-8 text-center text-white space-y-4">
            <p className="text-lg font-semibold">Você não está logado.</p>
            <div className="flex items-center justify-center gap-3">
              <Link
                href="/login"
                onClick={onClose}
                className="rounded-xl border border-white/30 px-4 py-2 text-white hover:bg-white/10 transition-colors"
              >
                Entrar
              </Link>
              <Link
                href="/cadastro"
                onClick={onClose}
                className="rounded-xl bg-yellow px-4 py-2 font-bold text-blue-950 hover:bg-yellow/90 transition-colors"
              >
                Cadastrar
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }
  
  // Garantir que displayUser não seja null
  if (!displayUser) return null

  return (
    <div
      className="fixed inset-0 z-50 bg-transparent"
      onClick={onClose}
    >
      <div
        className="absolute right-4 top-16 w-full max-w-md rounded-2xl bg-blue p-6 shadow-2xl md:right-8 md:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botão fechar */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-white hover:text-gray-300 transition-colors"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <>
          {/* Header do Perfil */}
          <div className="mb-6 flex items-center justify-between pr-8">
            <h2 className="text-xl font-bold text-white md:text-2xl">{displayUser.nome}</h2>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-white hover:bg-white/10 transition-colors"
              >
                <span className="iconify i-material-symbols:logout text-lg"></span>
                <span>Sair</span>
              </button>
            </div>

            {/* Bônus Semanal */}
            <div className="mb-6 rounded-xl border-2 border-white/20 bg-white/5 p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="iconify i-material-symbols:card-giftcard text-xl text-white"></span>
                  <span className="font-semibold text-white">Bônus semanal</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-yellow md:text-lg">{displayUser.bonusSemanal || 0}%</span>
                  <div className="relative h-10 w-10">
                    <svg className="h-10 w-10 -rotate-90 transform" viewBox="0 0 36 36">
                      <circle
                        cx="18"
                        cy="18"
                        r="16"
                        fill="none"
                        stroke="rgba(255,255,255,0.2)"
                        strokeWidth="3"
                      />
                      <circle
                        cx="18"
                        cy="18"
                        r="16"
                        fill="none"
                        stroke="white"
                        strokeWidth="3"
                        strokeDasharray={`${((displayUser.bonusSemanal || 0) / 100) * 100.48}, 100.48`}
                      />
                    </svg>
                  </div>
                </div>
              </div>
              <Link
                href="/bônus-semanal"
                className="text-sm font-semibold text-yellow hover:text-yellow/80 transition-colors"
              >
                Saiba mais
              </Link>
            </div>

            {/* Informações Financeiras */}
            <div className="mb-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white">Saldo:</span>
                <span className="text-lg font-bold text-white md:text-xl">R$ {displayUser.saldo.toFixed(2)}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-semibold text-white">Bônus:</span>
                <span className="text-lg font-bold text-white md:text-xl">R$ {displayUser.bonus.toFixed(2)}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-semibold text-white">Bônus bloqueado:</span>
                <span className="text-lg font-bold text-white md:text-xl">R$ {displayUser.bonusBloqueado.toFixed(2)}</span>
              </div>
            </div>

            {/* Links de Ação */}
            <div className="mb-6 space-y-3">
              <Link
                href="/minhas-apostas"
                onClick={onClose}
                className="flex items-center gap-3 rounded-lg p-3 text-yellow hover:bg-white/10 transition-colors"
              >
                <span className="iconify i-material-symbols:receipt text-xl"></span>
                <span className="font-semibold">Minhas apostas</span>
              </Link>

              <Link
                href="/carteira"
                onClick={onClose}
                className="flex items-center gap-3 rounded-lg border-2 border-white/20 bg-white/5 p-3 text-white hover:bg-white/10 transition-colors"
              >
                <span className="iconify i-material-symbols:account-balance-wallet text-xl"></span>
                <span className="font-semibold">Carteira</span>
              </Link>
            </div>
        </>
      </div>

      {/* Confirmação de logout */}
      <ConfirmacaoBonita
        isOpen={showConfirmacao}
        onClose={() => setShowConfirmacao(false)}
        onConfirm={confirmarLogout}
        titulo="Confirmar Saída"
        mensagem="Tem certeza que deseja sair?"
        textoConfirmar="Sair"
        textoCancelar="Cancelar"
        tipo="aviso"
      />
    </div>
  )
}
