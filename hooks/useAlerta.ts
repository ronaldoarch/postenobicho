'use client'

import { useState, useCallback } from 'react'

interface AlertaState {
  tipo: 'sucesso' | 'erro' | 'aviso' | 'info'
  titulo: string
  mensagem: string
}

export function useAlerta() {
  const [alerta, setAlerta] = useState<AlertaState | null>(null)

  const mostrarAlerta = useCallback((tipo: AlertaState['tipo'], titulo: string, mensagem: string) => {
    setAlerta({ tipo, titulo, mensagem })
  }, [])

  const fecharAlerta = useCallback(() => {
    setAlerta(null)
  }, [])

  const sucesso = useCallback((titulo: string, mensagem: string) => {
    mostrarAlerta('sucesso', titulo, mensagem)
  }, [mostrarAlerta])

  const erro = useCallback((titulo: string, mensagem: string) => {
    mostrarAlerta('erro', titulo, mensagem)
  }, [mostrarAlerta])

  const aviso = useCallback((titulo: string, mensagem: string) => {
    mostrarAlerta('aviso', titulo, mensagem)
  }, [mostrarAlerta])

  const info = useCallback((titulo: string, mensagem: string) => {
    mostrarAlerta('info', titulo, mensagem)
  }, [mostrarAlerta])

  return {
    alerta,
    mostrarAlerta,
    fecharAlerta,
    sucesso,
    erro,
    aviso,
    info,
  }
}
