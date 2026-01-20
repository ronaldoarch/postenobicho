'use client'

import { useState, useCallback } from 'react'

interface ConfirmacaoState {
  titulo: string
  mensagem: string
  textoConfirmar?: string
  textoCancelar?: string
  tipo?: 'perigo' | 'aviso' | 'info'
  onConfirm: () => void
}

export function useConfirmacao() {
  const [confirmacao, setConfirmacao] = useState<ConfirmacaoState | null>(null)

  const mostrarConfirmacao = useCallback((
    titulo: string,
    mensagem: string,
    onConfirm: () => void,
    tipo: 'perigo' | 'aviso' | 'info' = 'aviso',
    textoConfirmar?: string,
    textoCancelar?: string
  ) => {
    setConfirmacao({
      titulo,
      mensagem,
      onConfirm,
      tipo,
      textoConfirmar,
      textoCancelar,
    })
  }, [])

  const fecharConfirmacao = useCallback(() => {
    setConfirmacao(null)
  }, [])

  const confirmar = useCallback(() => {
    if (confirmacao) {
      confirmacao.onConfirm()
      setConfirmacao(null)
    }
  }, [confirmacao])

  return {
    confirmacao,
    mostrarConfirmacao,
    fecharConfirmacao,
    confirmar,
  }
}
