'use client'

import { useEffect, useState } from 'react'
import { useAlerta } from '@/hooks/useAlerta'
import AlertaBonito from '@/components/AlertaBonito'

interface Gateway {
  id: number
  name: string
  tipo: string
  baseUrl: string
  apiKey: string
  webhookUrl?: string
  sandbox: boolean
  active: boolean
}

const emptyForm: Omit<Gateway, 'id'> = {
  name: '',
  tipo: 'receba',
  baseUrl: '',
  apiKey: '',
  webhookUrl: '',
  sandbox: true,
  active: true,
}

export default function GatewaysPage() {
  const { alerta, sucesso, erro, fecharAlerta } = useAlerta()
  const [gateways, setGateways] = useState<Gateway[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<Omit<Gateway, 'id'>>(emptyForm)
  const [editingId, setEditingId] = useState<number | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/gateways', { cache: 'no-store' })
      const data = await res.json()
      setGateways(data.gateways || [])
    } catch (error) {
      console.error('Erro ao carregar gateways', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const method = editingId ? 'PUT' : 'POST'
      const body = editingId ? { id: editingId, ...form } : form
      
      // Validações específicas para NXGate
      if (form.tipo === 'nxgate') {
        if (!form.baseUrl || !form.baseUrl.includes('nxgate.com.br')) {
          erro('URL Inválida', 'Para NXGate, a Base URL deve ser https://nxgate.com.br')
          setSaving(false)
          return
        }
        if (!form.apiKey || form.apiKey.length < 10) {
          erro('API Key Inválida', 'A API Key do NXGate é obrigatória e deve ter pelo menos 10 caracteres')
          setSaving(false)
          return
        }
      }
      
      const res = await fetch('/api/admin/gateways', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Erro ao salvar gateway' }))
        erro('Erro', errorData.error || 'Erro ao salvar gateway')
        setSaving(false)
        return
      }
      
      sucesso('Sucesso', editingId ? 'Gateway atualizado com sucesso!' : 'Gateway cadastrado com sucesso!')
      setForm(emptyForm)
      setEditingId(null)
      load()
    } catch (error) {
      console.error('Erro ao salvar gateway', error)
      erro('Erro', 'Erro ao salvar gateway. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (gw: Gateway) => {
    setEditingId(gw.id)
    setForm({
      name: gw.name,
      tipo: gw.tipo || 'receba',
      baseUrl: gw.baseUrl,
      apiKey: gw.apiKey,
      webhookUrl: gw.webhookUrl || '',
      sandbox: gw.sandbox,
      active: gw.active,
    })
  }

  const handleDelete = async (id: number) => {
    const gateway = gateways.find(g => g.id === id)
    if (!gateway) return
    
    if (!confirm(`Tem certeza que deseja remover o gateway "${gateway.name}"?`)) return
    
    try {
      const res = await fetch(`/api/admin/gateways?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        sucesso('Sucesso', 'Gateway removido com sucesso!')
        load()
      } else {
        erro('Erro', 'Erro ao remover gateway')
      }
    } catch (error) {
      console.error('Erro ao deletar gateway', error)
      erro('Erro', 'Erro ao remover gateway')
    }
  }

  const handleToggle = async (gw: Gateway) => {
    try {
      await fetch('/api/admin/gateways', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: gw.id, active: !gw.active }),
      })
      load()
    } catch (error) {
      console.error('Erro ao ativar/desativar gateway', error)
    }
  }

  // Atualizar campos quando tipo mudar
  useEffect(() => {
    if (form.tipo === 'nxgate') {
      if (!form.baseUrl || form.baseUrl === 'https://sandbox.receba.online') {
        setForm(prev => ({ ...prev, baseUrl: 'https://nxgate.com.br' }))
      }
      if (!form.webhookUrl && typeof window !== 'undefined') {
        const webhookUrl = `${window.location.origin}/api/webhooks/nxgate`
        setForm(prev => ({ ...prev, webhookUrl }))
      }
    } else if (form.tipo === 'receba') {
      if (!form.baseUrl || form.baseUrl === 'https://nxgate.com.br') {
        setForm(prev => ({ ...prev, baseUrl: 'https://sandbox.receba.online' }))
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.tipo])

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gateways de Pagamento</h1>
          <p className="text-gray-600 mt-2">Configure os gateways de pagamento PIX para depósitos e saques</p>
        </div>
      </div>

      {/* Informações sobre NXGate */}
      {form.tipo === 'nxgate' && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">📋 Informações sobre NXGate</h3>
          <div className="space-y-2 text-sm text-blue-800">
            <p><strong>Base URL:</strong> https://nxgate.com.br</p>
            <p><strong>API Key:</strong> Sua chave secreta fornecida pelo NXGate</p>
            <p><strong>Webhook URL:</strong> URL onde você receberá notificações de pagamento</p>
            <div className="mt-4 pt-4 border-t border-blue-200">
              <p className="font-semibold mb-2">Endpoints disponíveis:</p>
              <ul className="list-disc list-inside space-y-1">
                <li><strong>Depósito PIX:</strong> POST /api/pix/gerar</li>
                <li><strong>Saque PIX:</strong> POST /api/pix/sacar</li>
                <li><strong>Webhook:</strong> POST {form.webhookUrl || '/api/webhooks/nxgate'}</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      <section className="bg-white rounded-xl shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          {editingId ? 'Editar Gateway' : 'Novo Gateway'}
        </h2>
        <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-700">Nome</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="rounded-lg border border-gray-300 px-3 py-2 focus:border-blue focus:outline-none"
              placeholder="Receba.online ou Nxgate"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-700">Tipo de Gateway</label>
            <select
              required
              value={form.tipo}
              onChange={(e) => setForm({ ...form, tipo: e.target.value })}
              className="rounded-lg border border-gray-300 px-3 py-2 focus:border-blue focus:outline-none"
            >
              <option value="receba">Receba Online</option>
              <option value="nxgate">NXGate</option>
            </select>
            <p className="text-xs text-gray-500">Selecione o gateway de pagamento que deseja configurar</p>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-700">Base URL</label>
            <input
              required
              value={form.baseUrl}
              onChange={(e) => setForm({ ...form, baseUrl: e.target.value })}
              className="rounded-lg border border-gray-300 px-3 py-2 focus:border-blue focus:outline-none"
              placeholder={form.tipo === 'nxgate' ? 'https://nxgate.com.br' : 'https://sandbox.receba.online'}
            />
            {form.tipo === 'nxgate' && (
              <p className="text-xs text-gray-500">URL base da API do NXGate</p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-700">
              Webhook URL {form.tipo === 'nxgate' && <span className="text-red-500">*</span>}
            </label>
            <input
              value={form.webhookUrl || ''}
              onChange={(e) => setForm({ ...form, webhookUrl: e.target.value })}
              className="rounded-lg border border-gray-300 px-3 py-2 focus:border-blue focus:outline-none"
              placeholder={form.tipo === 'nxgate' ? `${typeof window !== 'undefined' ? window.location.origin : ''}/api/webhooks/nxgate` : 'https://seudominio.com/api/webhooks'}
            />
            {form.tipo === 'nxgate' && (
              <p className="text-xs text-gray-500">
                URL onde você receberá notificações de pagamento. Deve responder com HTTP 200 e JSON: {"{"}"status": "received"{"}"}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-2 md:col-span-2">
            <label className="text-sm font-semibold text-gray-700">API Key (Chave Secreta)</label>
            <input
              required
              type="password"
              value={form.apiKey}
              onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
              className="rounded-lg border border-gray-300 px-3 py-2 focus:border-blue focus:outline-none font-mono text-sm"
              placeholder={form.tipo === 'nxgate' ? 'd6fd1a0ed8daf4b33754d9f7d494d697' : 'API Key do gateway'}
            />
            {form.tipo === 'nxgate' && (
              <p className="text-xs text-gray-500">
                Sua chave secreta (api_key) fornecida pelo NXGate. Esta chave é usada para autenticar todas as requisições.
              </p>
            )}
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <input
                type="checkbox"
                checked={form.sandbox}
                onChange={(e) => setForm({ ...form, sandbox: e.target.checked })}
              />
              Sandbox
            </label>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
              />
              Ativo
            </label>
          </div>
          <div className="md:col-span-2 flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-blue px-4 py-2 font-semibold text-white hover:bg-blue-scale-70 transition-colors disabled:opacity-60"
            >
              {editingId ? 'Salvar alterações' : 'Adicionar gateway'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null)
                  setForm(emptyForm)
                }}
                className="rounded-lg border border-gray-300 px-4 py-2 font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="bg-white rounded-xl shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Gateways cadastrados</h2>
          {loading && <span className="text-sm text-gray-500">Carregando...</span>}
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Base URL</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sandbox</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ativo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {gateways.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-sm text-gray-500 text-center">
                    Nenhum gateway cadastrado.
                  </td>
                </tr>
              )}
              {gateways.map((gw) => (
                <tr key={gw.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{gw.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{gw.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      gw.tipo === 'nxgate' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {gw.tipo === 'nxgate' ? 'Nxgate' : 'Receba'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{gw.baseUrl}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className={`px-2 py-1 rounded-full text-xs ${gw.sandbox ? 'bg-yellow/20 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                      {gw.sandbox ? 'Sandbox' : 'Produção'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => handleToggle(gw)}
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${gw.active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}
                    >
                      {gw.active ? 'Ativo' : 'Inativo'}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(gw)}
                        className="rounded-lg border border-gray-200 px-3 py-1 hover:bg-gray-50"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(gw.id)}
                        className="rounded-lg border border-red-200 px-3 py-1 text-red-600 hover:bg-red-50"
                      >
                        Remover
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Alerta bonito */}
      {alerta && (
        <AlertaBonito
          isOpen={!!alerta}
          onClose={fecharAlerta}
          tipo={alerta.tipo}
          titulo={alerta.titulo}
          mensagem={alerta.mensagem}
        />
      )}
    </div>
  )
}
