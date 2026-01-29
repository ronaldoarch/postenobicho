'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import React from 'react'

// Carregar mapa dinamicamente (client-side only)
const MapComponent = dynamic(() => import('@/components/MapaLocalizacoes'), {
  ssr: false,
  loading: () => (
    <div className="flex h-[600px] items-center justify-center rounded-lg bg-gray-100">
      <p className="text-gray-600">Carregando mapa...</p>
    </div>
  ),
}) as React.ComponentType<{ localizacoes: Localizacao[] }>

interface Localizacao {
  id: number
  ip: string
  tipo: 'cadastro' | 'aposta' | 'login'
  latitude: number | null
  longitude: number | null
  cidade: string | null
  estado: string | null
  pais: string | null
  regiao: string | null
  timezone: string | null
  isp: string | null
  createdAt: string
  Usuario?: {
    id: number
    nome: string
    email: string
  }
}

export default function LocalizacoesPage() {
  const [localizacoes, setLocalizacoes] = useState<Localizacao[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroTipo, setFiltroTipo] = useState<string>('')
  const [estatisticas, setEstatisticas] = useState({
    total: 0,
    cadastros: 0,
    apostas: 0,
    logins: 0,
    paises: new Set<string>(),
    estados: new Set<string>(),
  })

  useEffect(() => {
    loadLocalizacoes()
  }, [filtroTipo])

  const loadLocalizacoes = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filtroTipo) {
        params.append('tipo', filtroTipo)
      }

      const res = await fetch(`/api/admin/localizacoes?${params.toString()}`)
      if (!res.ok) {
        throw new Error('Erro ao carregar localizações')
      }

      const data = await res.json()
      // Garantir que os dados tenham a estrutura correta
      const localizacoesFormatadas = (data.localizacoes || []).map((loc: any) => ({
        ...loc,
        Usuario: loc.Usuario || { id: 0, nome: 'N/A', email: 'N/A' },
      }))
      setLocalizacoes(localizacoesFormatadas)

      // Calcular estatísticas
      const stats = {
        total: data.total || 0,
        cadastros: 0,
        apostas: 0,
        logins: 0,
        paises: new Set<string>(),
        estados: new Set<string>(),
      }

      data.localizacoes?.forEach((loc: Localizacao) => {
        if (loc.tipo === 'cadastro') stats.cadastros++
        if (loc.tipo === 'aposta') stats.apostas++
        if (loc.tipo === 'login') stats.logins++
        if (loc.pais) stats.paises.add(loc.pais)
        if (loc.estado) stats.estados.add(loc.estado)
      })

      setEstatisticas(stats)
    } catch (error) {
      console.error('Erro ao carregar localizações:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="mb-4 text-2xl font-bold text-gray-900">Mapa de Localizações</h1>
        <p className="text-gray-600">
          Visualize onde os usuários estão cadastrando e fazendo apostas baseado no IP.
        </p>
      </div>

      {/* Estatísticas */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-lg bg-white p-4 shadow">
          <div className="text-sm font-medium text-gray-600">Total de Registros</div>
          <div className="text-2xl font-bold text-gray-900">{estatisticas.total}</div>
        </div>
        <div className="rounded-lg bg-white p-4 shadow">
          <div className="text-sm font-medium text-gray-600">Cadastros</div>
          <div className="text-2xl font-bold text-blue-600">{estatisticas.cadastros}</div>
        </div>
        <div className="rounded-lg bg-white p-4 shadow">
          <div className="text-sm font-medium text-gray-600">Apostas</div>
          <div className="text-2xl font-bold text-green-600">{estatisticas.apostas}</div>
        </div>
        <div className="rounded-lg bg-white p-4 shadow">
          <div className="text-sm font-medium text-gray-600">Países Únicos</div>
          <div className="text-2xl font-bold text-purple-600">{estatisticas.paises.size}</div>
        </div>
      </div>

      {/* Filtros */}
      <div className="mb-4 flex flex-wrap gap-4">
        <select
          value={filtroTipo}
          onChange={(e) => setFiltroTipo(e.target.value)}
          className="rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
        >
          <option value="">Todos os tipos</option>
          <option value="cadastro">Cadastros</option>
          <option value="aposta">Apostas</option>
          <option value="login">Logins</option>
        </select>
        <button
          onClick={loadLocalizacoes}
          className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Atualizar
        </button>
        <button
          onClick={async () => {
            if (!confirm('Isso tentará geolocalizar usuários existentes usando o IP atual do servidor. Continuar?')) return
            try {
              const res = await fetch('/api/admin/localizacoes/geolocalizar-existentes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ usarIPAtual: true }),
              })
              const data = await res.json()
              alert(`Processados: ${data.resultados?.processados || 0}\nSucesso: ${data.resultados?.sucesso || 0}\nFalhas: ${data.resultados?.falhas || 0}`)
              loadLocalizacoes()
            } catch (error) {
              alert('Erro ao geolocalizar usuários existentes')
            }
          }}
          className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
        >
          📍 Geolocalizar Usuários Existentes
        </button>
      </div>

      {/* Mapa */}
      {loading ? (
        <div className="flex h-[600px] items-center justify-center rounded-lg bg-gray-100">
          <p className="text-gray-600">Carregando...</p>
        </div>
      ) : (
        <MapComponent localizacoes={localizacoes} />
      )}

      {/* Lista de localizações */}
      <div className="mt-6">
        <h2 className="mb-4 text-xl font-bold text-gray-900">Últimas Localizações</h2>
        <div className="overflow-x-auto rounded-lg bg-white shadow">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700">
                  Usuário
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700">
                  Tipo
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700">
                  Localização
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700">
                  IP
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700">
                  Data/Hora
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {localizacoes.slice(0, 20).map((loc) => (
                <tr key={loc.id}>
                  <td className="whitespace-nowrap px-4 py-3 text-sm">
                    <div className="font-medium text-gray-900">{loc.Usuario?.nome || 'N/A'}</div>
                    <div className="text-gray-500">{loc.Usuario?.email || 'N/A'}</div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                        loc.tipo === 'cadastro'
                          ? 'bg-blue-100 text-blue-800'
                          : loc.tipo === 'aposta'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {loc.tipo === 'cadastro' ? 'Cadastro' : loc.tipo === 'aposta' ? 'Aposta' : 'Login'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {loc.cidade && loc.estado ? (
                      <>
                        {loc.cidade}, {loc.estado}
                        {loc.pais && loc.pais !== 'Brazil' && `, ${loc.pais}`}
                      </>
                    ) : loc.pais ? (
                      loc.pais
                    ) : (
                      <span className="text-gray-400">Não disponível</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm font-mono text-gray-600">
                    {loc.ip}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                    {new Date(loc.createdAt).toLocaleString('pt-BR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
