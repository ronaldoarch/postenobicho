'use client'

import { useEffect, useState } from 'react'
import AlertaBonito from '@/components/AlertaBonito'
import { useAlerta } from '@/hooks/useAlerta'

interface IntegracoesConfig {
  metaPixelId?: string | null
  metaAccessToken?: string | null
  metaPixelEnabled?: boolean
  webhookUrl?: string | null
  webhookEnabled?: boolean
  webhookEvents?: string[] | null
  webhookSecret?: string | null
}

const EVENTOS_DISPONIVEIS = [
  { id: 'cadastro', label: 'Cadastro de Usuário', descricao: 'Quando um novo usuário se cadastra' },
  { id: 'deposito', label: 'Depósito', descricao: 'Quando um depósito é realizado' },
  { id: 'redeposito', label: 'Redepósito', descricao: 'Quando um segundo depósito é realizado' },
  { id: 'aposta', label: 'Aposta', descricao: 'Quando uma aposta é criada' },
  { id: 'aposta_ganha', label: 'Aposta Ganha', descricao: 'Quando uma aposta é ganha/liquidada' },
  { id: 'saque', label: 'Saque', descricao: 'Quando um saque é solicitado' },
  { id: 'saque_aprovado', label: 'Saque Aprovado', descricao: 'Quando um saque é aprovado' },
  { id: 'login', label: 'Login', descricao: 'Quando um usuário faz login' },
  { id: 'visualizacao_pagina', label: 'Visualização de Página', descricao: 'Quando uma página importante é visualizada' },
]

export default function IntegracoesPage() {
  const { alerta, sucesso, erro, fecharAlerta } = useAlerta()
  const [config, setConfig] = useState<IntegracoesConfig>({
    metaPixelId: '',
    metaAccessToken: '',
    metaPixelEnabled: false,
    webhookUrl: '',
    webhookEnabled: false,
    webhookEvents: [],
    webhookSecret: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      const response = await fetch('/api/admin/configuracoes', {
        credentials: 'include',
      })
      const data = await response.json()
      const configData = data.configuracoes || {}
      
      // Parse webhookEvents se for string JSON
      let webhookEvents = []
      if (configData.webhookEvents) {
        try {
          webhookEvents = typeof configData.webhookEvents === 'string' 
            ? JSON.parse(configData.webhookEvents) 
            : configData.webhookEvents
        } catch {
          webhookEvents = []
        }
      }
      
      setConfig({
        metaPixelId: configData.metaPixelId || '',
        metaAccessToken: configData.metaAccessToken || '',
        metaPixelEnabled: configData.metaPixelEnabled || false,
        webhookUrl: configData.webhookUrl || '',
        webhookEnabled: configData.webhookEnabled || false,
        webhookEvents: webhookEvents,
        webhookSecret: configData.webhookSecret || '',
      })
    } catch (error) {
      console.error('Erro ao carregar configurações:', error)
      erro('Erro', 'Erro ao carregar configurações de integrações')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const payload = {
        metaPixelId: config.metaPixelId || null,
        metaAccessToken: config.metaAccessToken || null,
        metaPixelEnabled: config.metaPixelEnabled || false,
        webhookUrl: config.webhookUrl || null,
        webhookEnabled: config.webhookEnabled || false,
        webhookEvents: config.webhookEvents ? JSON.stringify(config.webhookEvents) : null,
        webhookSecret: config.webhookSecret || null,
      }

      const response = await fetch('/api/admin/configuracoes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao salvar configurações')
      }

      sucesso('Sucesso', 'Configurações de integrações salvas com sucesso!')
    } catch (error: any) {
      console.error('Erro ao salvar:', error)
      erro('Erro', error.message || 'Erro ao salvar configurações')
    } finally {
      setSaving(false)
    }
  }

  const toggleEvento = (eventoId: string) => {
    setConfig((prev) => {
      const eventos = prev.webhookEvents || []
      const novosEventos = eventos.includes(eventoId)
        ? eventos.filter((e) => e !== eventoId)
        : [...eventos, eventoId]
      return { ...prev, webhookEvents: novosEventos }
    })
  }

  const testWebhook = async () => {
    if (!config.webhookUrl) {
      erro('Atenção', 'Configure a URL do webhook primeiro')
      return
    }

    try {
      const response = await fetch('/api/admin/integracoes/test-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ webhookUrl: config.webhookUrl }),
      })

      const data = await response.json()

      if (response.ok) {
        sucesso('Sucesso', 'Webhook testado com sucesso! Verifique os logs do servidor.')
      } else {
        erro('Erro', data.error || 'Erro ao testar webhook')
      }
    } catch (error: any) {
      erro('Erro', 'Erro ao testar webhook: ' + error.message)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">🔗 Integrações</h1>

      <AlertaBonito
        isOpen={!!alerta}
        onClose={fecharAlerta}
        tipo={alerta?.tipo || 'info'}
        titulo={alerta?.titulo || ''}
        mensagem={alerta?.mensagem || ''}
      />

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Meta Pixel (Facebook) */}
        <div className="bg-white rounded-lg shadow-md p-6 border-2 border-gray-200">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            📊 Meta Pixel (Facebook) - Rastreamento Avançado
          </h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ativar Meta Pixel
                </label>
                <p className="text-xs text-gray-500">
                  Ativa o rastreamento avançado com Facebook Pixel e Conversions API para melhorar a precisão das conversões.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.metaPixelEnabled || false}
                  onChange={(e) => setConfig({ ...config, metaPixelEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue"></div>
              </label>
            </div>

            {config.metaPixelEnabled && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Meta Pixel ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={config.metaPixelId || ''}
                    onChange={(e) => setConfig({ ...config, metaPixelId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue focus:border-transparent"
                    placeholder="123456789012345"
                    required={config.metaPixelEnabled}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Encontre seu Pixel ID em: Facebook Events Manager → Data Sources → Seu Pixel
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Conversions API Access Token <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={config.metaAccessToken || ''}
                    onChange={(e) => setConfig({ ...config, metaAccessToken: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue focus:border-transparent"
                    rows={3}
                    placeholder="EAAxxxxxxxxxxxxx"
                    required={config.metaPixelEnabled}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Gere o token em: Facebook Events Manager → Data Sources → Seu Pixel → Settings → Conversions API → Generate Access Token
                  </p>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>💡 Rastreamento Avançado:</strong> O sistema usa Facebook Pixel (frontend) + Conversions API (backend) para máximo rastreamento.
                    Eventos rastreados: Cadastro, Apostas, Depósitos, Saques, Visualizações e mais.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Webhook Tracking */}
        <div className="bg-white rounded-lg shadow-md p-6 border-2 border-gray-200">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            🔔 Webhook - Rastreamento via Webhook
          </h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ativar Webhook
                </label>
                <p className="text-xs text-gray-500">
                  Envia eventos importantes para um webhook externo para rastreamento avançado e integração com sistemas externos.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.webhookEnabled || false}
                  onChange={(e) => setConfig({ ...config, webhookEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue"></div>
              </label>
            </div>

            {config.webhookEnabled && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    URL do Webhook <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="url"
                    value={config.webhookUrl || ''}
                    onChange={(e) => setConfig({ ...config, webhookUrl: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue focus:border-transparent"
                    placeholder="https://seu-servidor.com/webhook"
                    required={config.webhookEnabled}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    URL completa do endpoint que receberá os eventos. Deve aceitar requisições POST com JSON.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Secret do Webhook (Opcional)
                  </label>
                  <input
                    type="text"
                    value={config.webhookSecret || ''}
                    onChange={(e) => setConfig({ ...config, webhookSecret: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue focus:border-transparent"
                    placeholder="seu-secret-aqui"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Secret usado para assinar as requisições (enviado no header X-Webhook-Signature). Deixe em branco se não usar assinatura.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Eventos para Rastrear <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {EVENTOS_DISPONIVEIS.map((evento) => {
                      const isSelected = (config.webhookEvents || []).includes(evento.id)
                      return (
                        <label
                          key={evento.id}
                          className={`flex items-start p-3 border-2 rounded-lg cursor-pointer transition-all ${
                            isSelected
                              ? 'border-blue bg-blue/10'
                              : 'border-gray-200 bg-white hover:border-gray-300'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleEvento(evento.id)}
                            className="mt-1 mr-3 w-4 h-4 text-blue border-gray-300 rounded focus:ring-blue"
                          />
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{evento.label}</div>
                            <div className="text-xs text-gray-500">{evento.descricao}</div>
                          </div>
                        </label>
                      )
                    })}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Selecione quais eventos devem ser enviados para o webhook. Pelo menos um evento deve ser selecionado.
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={testWebhook}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    🧪 Testar Webhook
                  </button>
                </div>

                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">
                    <strong>📡 Formato do Webhook:</strong> Os eventos serão enviados como POST JSON com a seguinte estrutura:
                    <pre className="mt-2 p-2 bg-white rounded text-xs overflow-x-auto">
{`{
  "event": "cadastro|deposito|aposta|...",
  "timestamp": "2024-01-01T12:00:00Z",
  "data": { ... dados do evento ... },
  "signature": "hash_assinatura" // se secret configurado
}`}
                    </pre>
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Botão Salvar */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 bg-blue text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 font-semibold"
          >
            {saving ? 'Salvando...' : '💾 Salvar Configurações'}
          </button>
        </div>
      </form>
    </div>
  )
}
