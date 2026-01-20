'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import AlertaBonito from '@/components/AlertaBonito'
import { useAlerta } from '@/hooks/useAlerta'

interface Configuracoes {
  nomePlataforma: string
  numeroSuporte: string
  emailSuporte: string
  whatsappSuporte: string
  logoSite: string
  liquidacaoAutomatica: boolean
}

interface HorariosConfig {
  horario09?: string | null
  horario11?: string | null
  horario14?: string | null
  horario16?: string | null
  horario18?: string | null
  horarioFederal?: string | null
  horario21?: string | null
  diasFederal?: string
  diasSem18e21?: string | null
  proximaDataSemExtracao?: string | null
}

export default function ConfiguracoesPage() {
  const { alerta, sucesso, erro, fecharAlerta } = useAlerta()
  const [config, setConfig] = useState<Configuracoes>({
    nomePlataforma: 'Poste no Bicho',
    numeroSuporte: '(00) 00000-0000',
    emailSuporte: 'suporte@postenobicho.com',
    whatsappSuporte: '5500000000000',
    logoSite: '',
    liquidacaoAutomatica: true,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [horarios, setHorarios] = useState<HorariosConfig>({
    horario09: '09:10',
    horario11: '11:10',
    horario14: '14:10',
    horario16: '16:10',
    horario18: '18:10',
    horarioFederal: '19:55',
    horario21: '21:10',
    diasFederal: 'Quarta,Sábado',
    diasSem18e21: 'Domingo',
    proximaDataSemExtracao: null,
  })
  const [savingHorarios, setSavingHorarios] = useState(false)

  useEffect(() => {
    loadConfig()
    loadHorarios()
  }, [])

  const loadConfig = async () => {
    try {
      const response = await fetch('/api/admin/configuracoes', {
        credentials: 'include',
      })
      const data = await response.json()
      setConfig({ ...config, ...(data.configuracoes || {}) })
    } catch (error) {
      console.error('Erro ao carregar configurações:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadHorarios = async () => {
    try {
      const response = await fetch('/api/admin/horarios', {
        credentials: 'include',
      })
      const data = await response.json()
      if (data.horarios) {
        setHorarios({
          ...data.horarios,
          proximaDataSemExtracao: data.horarios.proximaDataSemExtracao
            ? new Date(data.horarios.proximaDataSemExtracao).toISOString().split('T')[0]
            : null,
        })
      }
    } catch (error) {
      console.error('Erro ao carregar horários:', error)
    }
  }

  const handleFileUpload = async (file: File) => {
    setUploadingLogo(true)

    try {
      const uploadFormData = new FormData()
      uploadFormData.append('file', file)
      uploadFormData.append('type', 'logo')

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData,
      })

      const data = await response.json()

      if (data.success) {
        setConfig({ ...config, logoSite: data.url })
        sucesso('Upload Concluído', 'Logo enviado com sucesso!')
      } else {
        erro('Erro no Upload', data.error || 'Erro ao fazer upload')
      }
    } catch (error) {
      console.error('Erro ao fazer upload:', error)
      erro('Erro no Upload', 'Erro ao fazer upload do arquivo')
    } finally {
      setUploadingLogo(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch('/api/admin/configuracoes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(config),
      })

      if (response.ok) {
        sucesso('Configurações Salvas', 'Suas configurações foram salvas com sucesso!')
      } else {
        erro('Erro ao Salvar', 'Não foi possível salvar as configurações')
      }
    } catch (error) {
      console.error('Erro:', error)
      erro('Erro ao Salvar', 'Ocorreu um erro ao salvar as configurações')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Carregando...</div>
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Configurações Gerais</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-6 space-y-6">
        {/* Upload de Logo do Site */}
        <div className="border-b border-gray-200 pb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Logo do Site (Header)</h2>
          <p className="text-sm text-gray-600 mb-4">
            Esta logo aparece no cabeçalho do site, no lugar do nome da plataforma.
          </p>
          <div className="space-y-4">
            {config.logoSite && (
              <div className="relative w-32 h-32 border-2 border-gray-300 rounded-lg overflow-hidden bg-white">
                <Image
                  src={config.logoSite}
                  alt="Logo do site"
                  fill
                  className="object-contain p-2"
                />
                <button
                  type="button"
                  onClick={() => setConfig({ ...config, logoSite: '' })}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                >
                  ×
                </button>
              </div>
            )}
            <div>
              <input
                type="file"
                id="logo-site-upload"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    handleFileUpload(file)
                  }
                }}
                className="hidden"
                disabled={uploadingLogo}
              />
              <label
                htmlFor="logo-site-upload"
                className={`inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg cursor-pointer ${
                  uploadingLogo ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'
                }`}
              >
                {uploadingLogo ? 'Enviando...' : config.logoSite ? 'Trocar Logo' : 'Upload Logo do Site'}
              </label>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Nome da Plataforma</label>
          <input
            type="text"
            value={config.nomePlataforma}
            onChange={(e) => setConfig({ ...config, nomePlataforma: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Número de Suporte</label>
          <input
            type="text"
            value={config.numeroSuporte}
            onChange={(e) => setConfig({ ...config, numeroSuporte: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue focus:border-transparent"
            placeholder="(00) 00000-0000"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Email de Suporte</label>
          <input
            type="email"
            value={config.emailSuporte}
            onChange={(e) => setConfig({ ...config, emailSuporte: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">WhatsApp de Suporte</label>
          <input
            type="text"
            value={config.whatsappSuporte}
            onChange={(e) => setConfig({ ...config, whatsappSuporte: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue focus:border-transparent"
            placeholder="5500000000000"
            required
          />
          <p className="text-xs text-gray-500 mt-1">Formato: código do país + DDD + número (sem espaços ou caracteres especiais)</p>
        </div>

        {/* Controle de Liquidação Automática */}
        <div className="border-t border-gray-200 pt-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Liquidação Automática</h2>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ativar Liquidação Automática
              </label>
              <p className="text-xs text-gray-500">
                Quando ativada, o sistema liquida apostas automaticamente via cron job.
                Quando desativada, você pode liquidar apostas manualmente.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.liquidacaoAutomatica}
                onChange={(e) => setConfig({ ...config, liquidacaoAutomatica: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue"></div>
            </label>
          </div>
          {!config.liquidacaoAutomatica && (
            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                ⚠️ <strong>Atenção:</strong> Com a liquidação automática desativada, você precisará liquidar as apostas manualmente através do painel administrativo.
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 bg-blue text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {saving ? 'Salvando...' : 'Salvar Configurações'}
          </button>
        </div>
      </form>

      {/* Configurações de Horários e Dias */}
      <form
        onSubmit={async (e) => {
          e.preventDefault()
          setSavingHorarios(true)
          try {
            const response = await fetch('/api/admin/horarios', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({
                ...horarios,
                proximaDataSemExtracao: horarios.proximaDataSemExtracao
                  ? new Date(horarios.proximaDataSemExtracao).toISOString()
                  : null,
              }),
            })

            if (response.ok) {
              sucesso('Horários Salvos', 'Horários e dias foram salvos com sucesso!')
            } else {
              erro('Erro ao Salvar', 'Não foi possível salvar os horários')
            }
          } catch (error) {
            console.error('Erro:', error)
            erro('Erro ao Salvar', 'Ocorreu um erro ao salvar os horários')
          } finally {
            setSavingHorarios(false)
          }
        }}
        className="bg-white rounded-xl shadow-md p-6 mt-8 space-y-6"
      >
        {/* Dias de Loteria Federal */}
        <div className="border-b border-gray-200 pb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Dias de Loteria Federal</h2>
          <div className="flex flex-wrap gap-2">
            {[
              { value: 'Domingo', label: 'Domingo' },
              { value: 'Segunda', label: 'Segunda-feira' },
              { value: 'Terça', label: 'Terça-feira' },
              { value: 'Quarta', label: 'Quarta-feira' },
              { value: 'Quinta', label: 'Quinta-feira' },
              { value: 'Sexta', label: 'Sexta-feira' },
              { value: 'Sábado', label: 'Sábado' },
            ].map((dia) => {
              const diasArray = horarios.diasFederal?.split(',').map((d) => d.trim()) || []
              const isSelected = diasArray.includes(dia.value)
              return (
                <button
                  key={dia.value}
                  type="button"
                  onClick={() => {
                    const diasArray = horarios.diasFederal?.split(',').map((d) => d.trim()) || []
                    if (isSelected) {
                      const novosDias = diasArray.filter((d) => d !== dia.value).join(',')
                      setHorarios({
                        ...horarios,
                        diasFederal: novosDias || 'Quarta,Sábado',
                      })
                    } else {
                      setHorarios({
                        ...horarios,
                        diasFederal: [...diasArray, dia.value].join(','),
                      })
                    }
                  }}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    isSelected
                      ? 'bg-blue text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {dia.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Horários Limites */}
        <div className="border-b border-gray-200 pb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Horários Limites</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">09 Horas</label>
              <input
                type="time"
                value={horarios.horario09 || ''}
                onChange={(e) => setHorarios({ ...horarios, horario09: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">11 Horas</label>
              <input
                type="time"
                value={horarios.horario11 || ''}
                onChange={(e) => setHorarios({ ...horarios, horario11: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">14 Horas</label>
              <input
                type="time"
                value={horarios.horario14 || ''}
                onChange={(e) => setHorarios({ ...horarios, horario14: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">16 Horas</label>
              <input
                type="time"
                value={horarios.horario16 || ''}
                onChange={(e) => setHorarios({ ...horarios, horario16: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">18 Horas</label>
              <input
                type="time"
                value={horarios.horario18 || ''}
                onChange={(e) => setHorarios({ ...horarios, horario18: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Federal</label>
              <input
                type="time"
                value={horarios.horarioFederal || ''}
                onChange={(e) => setHorarios({ ...horarios, horarioFederal: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">21 Horas</label>
              <input
                type="time"
                value={horarios.horario21 || ''}
                onChange={(e) => setHorarios({ ...horarios, horario21: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Dias s/ Extrações às 18h e 21h */}
        <div className="border-b border-gray-200 pb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Dias s/ Extrações às 18h e 21h</h2>
          <div className="flex flex-wrap gap-2">
            {[
              { value: 'Domingo', label: 'Domingo' },
              { value: 'Segunda', label: 'Segunda-feira' },
              { value: 'Terça', label: 'Terça-feira' },
              { value: 'Quarta', label: 'Quarta-feira' },
              { value: 'Quinta', label: 'Quinta-feira' },
              { value: 'Sexta', label: 'Sexta-feira' },
              { value: 'Sábado', label: 'Sábado' },
            ].map((dia) => {
              const diasArray = horarios.diasSem18e21?.split(',').map((d) => d.trim()) || []
              const isSelected = diasArray.includes(dia.value)
              return (
                <button
                  key={dia.value}
                  type="button"
                  onClick={() => {
                    const diasArray = horarios.diasSem18e21?.split(',').map((d) => d.trim()) || []
                    if (isSelected) {
                      const novosDias = diasArray.filter((d) => d !== dia.value).join(',')
                      setHorarios({
                        ...horarios,
                        diasSem18e21: novosDias || null,
                      })
                    } else {
                      setHorarios({
                        ...horarios,
                        diasSem18e21: [...diasArray, dia.value].join(','),
                      })
                    }
                  }}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    isSelected
                      ? 'bg-blue text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {dia.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Próxima Data s/ Extrações */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Próxima Data s/ Extrações</h2>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <input
                type="date"
                value={horarios.proximaDataSemExtracao || ''}
                onChange={(e) =>
                  setHorarios({ ...horarios, proximaDataSemExtracao: e.target.value || null })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              disabled={savingHorarios}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {savingHorarios ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      </form>

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
