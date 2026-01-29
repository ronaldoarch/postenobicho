'use client'

import { useEffect, useState } from 'react'
import { useConfiguracoes } from '@/hooks/useConfiguracoes'

interface PagamentoPix {
  id: number
  chavePix: string
  nomeRecebedor: string
  valor: number
  nota: string | null
  transactionId: string | null
  status: 'pendente' | 'pago' | 'falhou'
  admin?: {
    nome: string
    email: string
  } | null
  createdAt: string
}

export default function PagamentosPixPage() {
  const { configuracoes } = useConfiguracoes()
  const [pagamentos, setPagamentos] = useState<PagamentoPix[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    chavePix: '',
    nomeRecebedor: '',
    valor: '',
    nota: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')

  useEffect(() => {
    loadPagamentos()
  }, [dataInicio, dataFim])

  const loadPagamentos = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (dataInicio) params.append('dataInicio', dataInicio)
      if (dataFim) params.append('dataFim', dataFim)

      const response = await fetch(`/api/admin/pagamentos-pix?${params.toString()}`)
      const data = await response.json()

      if (data.pagamentos) {
        setPagamentos(data.pagamentos)
      }
    } catch (error) {
      console.error('Erro ao carregar pagamentos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const response = await fetch('/api/admin/pagamentos-pix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar pagamento')
      }

      // Limpar formulário e recarregar lista
      setFormData({ chavePix: '', nomeRecebedor: '', valor: '', nota: '' })
      setShowForm(false)
      loadPagamentos()
      alert('Pagamento PIX registrado com sucesso!')
    } catch (error: any) {
      alert(error.message || 'Erro ao criar pagamento')
    } finally {
      setSubmitting(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR')
  }

  const totalPagamentos = pagamentos.reduce((sum, p) => sum + Number(p.valor || 0), 0)

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Pagamentos PIX</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-white font-semibold hover:bg-green-700 transition-colors"
        >
          <span>➕</span>
          <span>{showForm ? 'Cancelar' : 'Novo Pagamento'}</span>
        </button>
      </div>

      {/* Formulário de Novo Pagamento */}
      {showForm && (
        <div className="mb-6 rounded-xl bg-white p-6 shadow-md">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Registrar Novo Pagamento PIX</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chave PIX <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.chavePix}
                  onChange={(e) => setFormData({ ...formData, chavePix: e.target.value })}
                  required
                  placeholder="CPF, CNPJ, email, telefone ou chave aleatória"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome do Recebedor <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.nomeRecebedor}
                  onChange={(e) => setFormData({ ...formData, nomeRecebedor: e.target.value })}
                  required
                  placeholder="Nome completo"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valor <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.valor}
                  onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                  required
                  placeholder="0.00"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nota/Observação
                </label>
                <input
                  type="text"
                  value={formData.nota}
                  onChange={(e) => setFormData({ ...formData, nota: e.target.value })}
                  placeholder="Descrição do pagamento"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue focus:outline-none"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-green-600 px-6 py-2 text-white font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? 'Salvando...' : 'Registrar Pagamento'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  setFormData({ chavePix: '', nomeRecebedor: '', valor: '', nota: '' })
                }}
                className="rounded-lg border border-gray-300 px-6 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filtros de Data */}
      <div className="mb-6 rounded-xl bg-white p-6 shadow-md">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Filtro por Período</h2>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Data Início</label>
            <input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue focus:outline-none"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Data Fim</label>
            <input
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue focus:outline-none"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setDataInicio('')
                setDataFim('')
              }}
              className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Limpar Filtros
            </button>
          </div>
        </div>
      </div>

      {/* Card de Total */}
      <div className="mb-6 rounded-xl bg-white p-6 shadow-md border-l-4 border-green-600">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-600 text-sm">Total de Pagamentos</p>
            <p className="text-3xl font-bold text-green-600 mt-2">{formatCurrency(totalPagamentos)}</p>
            <p className="text-sm text-gray-500 mt-1">{pagamentos.length} pagamento(s)</p>
          </div>
          <span className="text-4xl">💸</span>
        </div>
      </div>

      {/* Lista de Pagamentos */}
      {loading ? (
        <div className="text-center py-12">
          <div className="text-gray-600">Carregando pagamentos...</div>
        </div>
      ) : pagamentos.length === 0 ? (
        <div className="text-center py-12 rounded-xl bg-white shadow-md">
          <p className="text-gray-600">Nenhum pagamento encontrado</p>
        </div>
      ) : (
        <div className="rounded-xl bg-white shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Chave PIX
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Recebedor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nota
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Admin
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pagamentos.map((pagamento) => (
                  <tr key={pagamento.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(pagamento.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {pagamento.chavePix}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {pagamento.nomeRecebedor}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                      {formatCurrency(pagamento.valor)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {pagamento.nota || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        pagamento.status === 'pago' 
                          ? 'bg-green-100 text-green-800' 
                          : pagamento.status === 'falhou'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {pagamento.status === 'pago' ? 'Pago' : pagamento.status === 'falhou' ? 'Falhou' : 'Pendente'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {pagamento.admin?.nome || 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
