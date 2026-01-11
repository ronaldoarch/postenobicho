'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Extracao {
  id: number
  name: string
  time: string
  active: boolean
}

export default function ResultsSection() {
  const [extracoes, setExtracoes] = useState<Extracao[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadExtracoes()
    
    const handleFocus = () => {
      loadExtracoes()
    }
    window.addEventListener('focus', handleFocus)
    
    return () => {
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  const loadExtracoes = async () => {
    try {
      const response = await fetch(`/api/admin/extracoes?t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
      })
      const data = await response.json()
      if (data.extracoes && data.extracoes.length > 0) {
        // Mostrar apenas extrações ativas e limitar a 8
        const activeExtracoes = data.extracoes
          .filter((e: Extracao) => e.active)
          .slice(0, 8)
        setExtracoes(activeExtracoes)
      }
    } catch (error) {
      console.error('Erro ao carregar extrações:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = () => {
    const today = new Date()
    const dayNames = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado']
    const monthNames = [
      'janeiro',
      'fevereiro',
      'março',
      'abril',
      'maio',
      'junho',
      'julho',
      'agosto',
      'setembro',
      'outubro',
      'novembro',
      'dezembro',
    ]
    return `${dayNames[today.getDay()]}, ${today.getDate()} de ${monthNames[today.getMonth()]} de ${today.getFullYear()}`
  }

  if (loading) {
    return (
      <section className="w-full rounded-xl bg-white p-4 md:p-6 lg:p-8">
        <div className="text-center py-8 text-gray-600">Carregando resultados...</div>
      </section>
    )
  }

  if (extracoes.length === 0) {
    return null
  }

  return (
    <section className="w-full rounded-xl bg-white p-4 md:p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="iconify i-material-symbols:list-alt text-gray-scale-700 text-2xl lg:text-3xl"></span>
          <h2 className="text-lg font-bold uppercase leading-none text-gray-scale-700 md:text-xl lg:text-2xl">
            RESULTADOS
          </h2>
        </div>
        <Link
          href="/jogo-do-bicho/resultados"
          className="text-sm font-semibold text-blue underline hover:text-blue-700 transition-colors"
        >
          Ver todos
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {extracoes.map((extracao) => (
          <div
            key={extracao.id}
            className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-4 hover:border-blue hover:bg-blue/5 transition-colors"
          >
            <div className="flex flex-col gap-1">
              <h3 className="font-bold text-blue">{extracao.name}</h3>
              <p className="text-sm text-gray-600">{formatDate()}</p>
            </div>
            <Link
              href="/jogo-do-bicho/resultados"
              className="rounded-lg border-2 border-blue bg-white px-4 py-2 text-sm font-semibold text-blue hover:bg-blue hover:text-white transition-colors"
            >
              Ver resultados
            </Link>
          </div>
        ))}
      </div>
    </section>
  )
}
