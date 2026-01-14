'use client'

import { useEffect } from 'react'

interface AlertModalProps {
  isOpen: boolean
  title: string
  message: string
  type?: 'error' | 'warning' | 'info' | 'success'
  onClose: () => void
  autoClose?: number // Tempo em ms para fechar automaticamente
}

export default function AlertModal({
  isOpen,
  title,
  message,
  type = 'error',
  onClose,
  autoClose,
}: AlertModalProps) {
  useEffect(() => {
    if (isOpen && autoClose) {
      const timer = setTimeout(() => {
        onClose()
      }, autoClose)
      return () => clearTimeout(timer)
    }
  }, [isOpen, autoClose, onClose])

  if (!isOpen) return null

  const typeStyles = {
    error: {
      bg: 'bg-red-50',
      border: 'border-red-300',
      icon: '❌',
      iconBg: 'bg-red-100',
      titleColor: 'text-red-800',
      messageColor: 'text-red-700',
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-300',
      icon: '⚠️',
      iconBg: 'bg-yellow-100',
      titleColor: 'text-yellow-800',
      messageColor: 'text-yellow-700',
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-300',
      icon: 'ℹ️',
      iconBg: 'bg-blue-100',
      titleColor: 'text-blue-800',
      messageColor: 'text-blue-700',
    },
    success: {
      bg: 'bg-green-50',
      border: 'border-green-300',
      icon: '✅',
      iconBg: 'bg-green-100',
      titleColor: 'text-green-800',
      messageColor: 'text-green-700',
    },
  }

  const styles = typeStyles[type]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        className={`relative w-full max-w-md rounded-xl border-2 ${styles.border} ${styles.bg} p-6 shadow-2xl animate-in fade-in zoom-in duration-200`}
      >
        <button
          onClick={onClose}
          className="absolute right-3 top-3 rounded-full p-1 text-gray-400 hover:bg-white/50 transition-colors"
          aria-label="Fechar"
        >
          <span className="iconify text-xl" data-icon="material-symbols:close"></span>
        </button>

        <div className="flex items-start gap-4">
          <div className={`flex h-12 w-12 items-center justify-center rounded-full ${styles.iconBg} text-2xl`}>
            {styles.icon}
          </div>
          <div className="flex-1">
            <h3 className={`mb-2 text-xl font-bold ${styles.titleColor}`}>{title}</h3>
            <p className={`text-base ${styles.messageColor}`}>{message}</p>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className={`rounded-lg px-6 py-2 font-semibold text-white transition-colors ${
              type === 'error'
                ? 'bg-red-600 hover:bg-red-700'
                : type === 'warning'
                  ? 'bg-yellow-600 hover:bg-yellow-700'
                  : type === 'info'
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            Entendi
          </button>
        </div>
      </div>
    </div>
  )
}
