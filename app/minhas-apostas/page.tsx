'use client'

import { useEffect, useState } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import BottomNav from '@/components/BottomNav'

interface Aposta {
  id: number
  concurso: string
  loteria: string
  estado: string
  horario: string
  data: string
  aposta: string
  valor: number
  retorno: number
  status: 'pendente' | 'ganhou' | 'perdeu'
}

export default function MinhasApostasPage() {
  const [apostas, setApostas] = useState<Aposta[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch('/api/apostas', { credentials: 'include' })
        const data = await res.json()
        if (!res.ok) {
          throw new Error(data.error || 'Erro ao carregar apostas')
        }
        setApostas(data.apostas || [])
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar apostas')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className="flex min-h-screen flex-col bg-gray-scale-100">
      <Header />
      <main className="relative flex flex-1 flex-col overflow-auto bg-gray-scale-100 text-[#1C1C1C]">
        <div className="mx-auto flex w-full max-w-[1286px] flex-col gap-4 px-4 py-6 md:px-6 md:py-8 lg:px-8">
          <h1 className="text-2xl font-bold text-gray-900">Minhas apostas</h1>
          {loading && <div className="text-gray-600">Carregando...</div>}
          {error && <div className="text-red-600">{error}</div>}

          {!loading && !error && apostas.length === 0 && (
            <div className="rounded-lg border border-dashed border-gray-200 bg-white px-4 py-6 text-sm text-gray-700">
              Nenhuma aposta encontrada. Faça login e realize uma aposta.
            </div>
          )}

          {!loading && !error && apostas.length > 0 && (
            <div className="overflow-x-auto rounded-xl bg-white shadow">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 text-left text-sm font-semibold text-gray-700">
                    <th className="px-4 py-3">Concurso</th>
                    <th className="px-4 py-3">Aposta</th>
                    <th className="px-4 py-3">Data</th>
                    <th className="px-4 py-3">Valor</th>
                    <th className="px-4 py-3">Retorno</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {apostas.map((a) => (
                    <tr key={a.id} className="border-b border-gray-100 text-sm text-gray-800">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-900">{a.concurso}</div>
                        <div className="text-xs text-gray-500">
                          {a.loteria} • {a.estado} • {a.horario}
                        </div>
                      </td>
                      <td className="px-4 py-3">{a.aposta}</td>
                      <td className="px-4 py-3">{a.data}</td>
                      <td className="px-4 py-3">R$ {a.valor.toFixed(2)}</td>
                      <td className="px-4 py-3">R$ {a.retorno.toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-semibold ${
                            a.status === 'ganhou'
                              ? 'bg-green-100 text-green-800'
                              : a.status === 'pendente'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {a.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
      <Footer />
      <BottomNav />
    </div>
  )
}
