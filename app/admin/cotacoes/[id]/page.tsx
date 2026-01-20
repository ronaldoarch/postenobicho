'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

interface Modalidade {
  id: number
  name: string
  value: string
}

interface Extracao {
  id: number
  name: string
  time?: string
}

interface Promocao {
  id: number
  titulo?: string
  tipo: string
}

interface Cotacao {
  id: number
  name?: string
  value?: string
  modalidadeId?: number
  extracaoId?: number
  promocaoId?: number
  isSpecial: boolean
  active: boolean
  modalidade?: { id: number; name: string }
  extracao?: { id: number; name: string; time?: string }
  promocao?: { id: number; titulo?: string; tipo: string }
}

export default function EditCotacaoPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [modalidades, setModalidades] = useState<Modalidade[]>([])
  const [extracoes, setExtracoes] = useState<Extracao[]>([])
  const [promocoes, setPromocoes] = useState<Promocao[]>([])
  const [cotacao, setCotacao] = useState<Cotacao | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    value: '',
    modalidadeId: '',
    extracaoId: '',
    promocaoId: '',
    isSpecial: false,
    active: true,
  })

  useEffect(() => {
    loadData()
  }, [id])

  const loadData = async () => {
    try {
      // Carregar modalidades
      const modRes = await fetch('/api/modalidades')
      const modData = await modRes.json()
      setModalidades(modData.modalidades || [])

      // Carregar extrações
      const extRes = await fetch('/api/admin/extracoes')
      const extData = await extRes.json()
      setExtracoes(extData.extracoes || [])

      // Carregar promoções ativas
      const promRes = await fetch('/api/admin/promocoes?active=true')
      const promData = await promRes.json()
      setPromocoes(promData.promocoes || [])

      // Carregar cotação
      const cotRes = await fetch('/api/admin/cotacoes')
      const cotData = await cotRes.json()
      const foundCotacao = cotData.cotacoes.find((c: Cotacao) => c.id === parseInt(id))
      
      if (!foundCotacao) {
        alert('Cotação não encontrada')
        router.push('/admin/cotacoes')
        return
      }

      setCotacao(foundCotacao)
      setFormData({
        name: foundCotacao.name || '',
        value: foundCotacao.value || '',
        modalidadeId: foundCotacao.modalidadeId?.toString() || '',
        extracaoId: foundCotacao.extracaoId?.toString() || '',
        promocaoId: foundCotacao.promocaoId?.toString() || '',
        isSpecial: foundCotacao.isSpecial,
        active: foundCotacao.active,
      })
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      alert('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch('/api/admin/cotacoes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: parseInt(id),
          ...formData,
          modalidadeId: formData.modalidadeId || null,
          extracaoId: formData.extracaoId || null,
          promocaoId: formData.promocaoId || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        alert(data.error || 'Erro ao atualizar cotação')
        return
      }

      alert('Cotação atualizada com sucesso!')
      router.push('/admin/cotacoes')
    } catch (error) {
      console.error('Erro ao atualizar cotação:', error)
      alert('Erro ao atualizar cotação')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Carregando...</div>
  }

  if (!cotacao) {
    return null
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Editar Cotação</h1>
        <Link
          href="/admin/cotacoes"
          className="text-gray-600 hover:text-gray-900"
        >
          ← Voltar
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-6">
        <div className="space-y-6">
          {/* Nome */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome (opcional)
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue focus:border-transparent"
              placeholder="Ex: Cotação Especial PONTO-NOITE"
            />
          </div>

          {/* Valor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Valor <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.value}
              onChange={(e) => setFormData({ ...formData, value: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue focus:border-transparent"
              placeholder="1x R$ 7000.00"
              required
            />
            <p className="mt-1 text-sm text-gray-500">
              Formato: 1x R$ XXXX.XX
            </p>
          </div>

          {/* Modalidade */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Modalidade
            </label>
            <select
              value={formData.modalidadeId}
              onChange={(e) => setFormData({ ...formData, modalidadeId: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue focus:border-transparent"
            >
              <option value="">Todas</option>
              {modalidades.map((mod) => (
                <option key={mod.id} value={mod.id}>
                  {mod.name}
                </option>
              ))}
            </select>
          </div>

          {/* Extração */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Extração
            </label>
            <select
              value={formData.extracaoId}
              onChange={(e) => setFormData({ ...formData, extracaoId: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue focus:border-transparent"
            >
              <option value="">Todas</option>
              {extracoes.map((ext) => (
                <option key={ext.id} value={ext.id}>
                  {ext.name} {ext.time && `(${ext.time})`}
                </option>
              ))}
            </select>
          </div>

          {/* Promoção */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Promoção
            </label>
            <select
              value={formData.promocaoId}
              onChange={(e) => setFormData({ ...formData, promocaoId: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue focus:border-transparent"
            >
              <option value="">Nenhuma</option>
              {promocoes.map((prom) => (
                <option key={prom.id} value={prom.id}>
                  {prom.titulo || prom.tipo}
                </option>
              ))}
            </select>
          </div>

          {/* Especial */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isSpecial"
              checked={formData.isSpecial}
              onChange={(e) => setFormData({ ...formData, isSpecial: e.target.checked })}
              className="h-4 w-4 text-blue focus:ring-blue border-gray-300 rounded"
            />
            <label htmlFor="isSpecial" className="ml-2 block text-sm text-gray-700">
              Especial (mostra foguinho 🔥)
            </label>
          </div>

          {/* Ativa */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="active"
              checked={formData.active}
              onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
              className="h-4 w-4 text-blue focus:ring-blue border-gray-300 rounded"
            />
            <label htmlFor="active" className="ml-2 block text-sm text-gray-700">
              Ativa
            </label>
          </div>

          {/* Botões */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="bg-blue text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
            <Link
              href="/admin/cotacoes"
              className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancelar
            </Link>
          </div>
        </div>
      </form>
    </div>
  )
}
