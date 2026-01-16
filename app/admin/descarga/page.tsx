'use client'

import { useEffect, useState } from 'react'

// Página de gerenciamento de descarga/controle de banca

interface LimiteDescarga {
  id: number
  modalidade: string
  premio: number
  limite: number
  ativo: boolean
}

interface AlertaDescarga {
  id: number
  modalidade: string
  premio: number
  valorAtual: number
  limite: number
  excedente: number
  resolvido: boolean
  createdAt: string
}

const MODALIDADES = [
  'Grupo',
  'Dupla de Grupo',
  'Terno de Grupo',
  'Quadra de Grupo',
  'Dezena',
  'Centena',
  'Milhar',
  'Dezena Invertida',
  'Centena Invertida',
  'Milhar Invertida',
  'Milhar/Centena',
  'Passe vai',
  'Passe vai e vem',
  'Quadra de Dezena',
  'Duque de Dezena (EMD)',
  'Terno de Dezena (EMD)',
  'Dezeninha',
  'Terno de Grupo Seco',
]

export default function DescargaPage() {
  const [limites, setLimites] = useState<LimiteDescarga[]>([])
  const [alertas, setAlertas] = useState<AlertaDescarga[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    modalidade: '',
    premio: 1,
    limite: 0,
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [limitesRes, alertasRes] = await Promise.all([
        fetch('/api/admin/descarga?action=limites', {
          credentials: 'include',
        }),
        fetch('/api/admin/descarga?action=alertas', {
          credentials: 'include',
        }),
      ])

      if (limitesRes.ok) {
        const limitesData = await limitesRes.json()
        setLimites(limitesData.limites || [])
      }

      if (alertasRes.ok) {
        const alertasData = await alertasRes.json()
        setAlertas(alertasData.alertas || [])
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/admin/descarga', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        alert('Limite definido com sucesso!')
        setShowForm(false)
        setFormData({ modalidade: '', premio: 1, limite: 0 })
        loadData()
      } else {
        const error = await response.json()
        alert(`Erro: ${error.error || 'Erro ao definir limite'}`)
      }
    } catch (error) {
      console.error('Erro ao salvar limite:', error)
      alert('Erro ao salvar limite')
    }
  }

  const resolverAlerta = async (id: number) => {
    try {
      const response = await fetch('/api/admin/descarga', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id }),
      })

      if (response.ok) {
        alert('Alerta resolvido!')
        loadData()
      } else {
        alert('Erro ao resolver alerta')
      }
    } catch (error) {
      console.error('Erro ao resolver alerta:', error)
      alert('Erro ao resolver alerta')
    }
  }

  const toggleLimite = async (id: number, ativo: boolean) => {
    try {
      const limite = limites.find((l) => l.id === id)
      if (!limite) return

      const response = await fetch('/api/admin/descarga', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          modalidade: limite.modalidade,
          premio: limite.premio,
          limite: limite.limite,
          ativo: !ativo,
        }),
      })

      if (response.ok) {
        loadData()
      }
    } catch (error) {
      console.error('Erro ao atualizar limite:', error)
    }
  }

  const exportarPDF = () => {
    const dataAtual = new Date().toLocaleString('pt-BR')
    
    // Criar conteúdo HTML para o PDF
    let htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Relatório de Descarga - ${dataAtual}</title>
        <style>
          @media print {
            @page {
              margin: 1cm;
            }
          }
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
            color: #333;
          }
          h1 {
            color: #1e40af;
            border-bottom: 3px solid #1e40af;
            padding-bottom: 10px;
            margin-bottom: 30px;
          }
          h2 {
            color: #1e40af;
            margin-top: 30px;
            margin-bottom: 15px;
            font-size: 18px;
          }
          .info {
            background: #f3f4f6;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
            font-size: 12px;
          }
          th {
            background: #1e40af;
            color: white;
            padding: 10px;
            text-align: left;
            font-weight: bold;
          }
          td {
            padding: 8px 10px;
            border-bottom: 1px solid #e5e7eb;
          }
          tr:nth-child(even) {
            background: #f9fafb;
          }
          .status-ativo {
            color: #059669;
            font-weight: bold;
          }
          .status-inativo {
            color: #dc2626;
            font-weight: bold;
          }
          .alerta {
            background: #fef2f2;
            border-left: 4px solid #dc2626;
            padding: 10px;
            margin-bottom: 10px;
          }
          .resumo {
            background: #eff6ff;
            padding: 15px;
            border-radius: 5px;
            margin-top: 20px;
          }
          .valor {
            font-weight: bold;
            color: #1e40af;
          }
          .excedente {
            color: #dc2626;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <h1>Relatório de Descarga / Controle de Banca</h1>
        
        <div class="info">
          <strong>Data de Geração:</strong> ${dataAtual}<br>
          <strong>Total de Limites Cadastrados:</strong> ${limites.length}<br>
          <strong>Total de Alertas Ativos:</strong> ${alertas.filter(a => !a.resolvido).length}
        </div>

        <h2>Limites Cadastrados</h2>
        <table>
          <thead>
            <tr>
              <th>Modalidade</th>
              <th>Prêmio</th>
              <th>Limite (R$)</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
    `

    if (limites.length === 0) {
      htmlContent += `
            <tr>
              <td colspan="4" style="text-align: center; padding: 20px; color: #6b7280;">
                Nenhum limite cadastrado
              </td>
            </tr>
      `
    } else {
      limites.forEach((limite) => {
        htmlContent += `
            <tr>
              <td>${limite.modalidade}</td>
              <td>${limite.premio}º Prêmio</td>
              <td class="valor">R$ ${limite.limite.toFixed(2)}</td>
              <td class="${limite.ativo ? 'status-ativo' : 'status-inativo'}">
                ${limite.ativo ? 'Ativo' : 'Inativo'}
              </td>
            </tr>
        `
      })
    }

    htmlContent += `
          </tbody>
        </table>
    `

    // Adicionar alertas se houver
    const alertasAtivos = alertas.filter((a) => !a.resolvido)
    if (alertasAtivos.length > 0) {
      htmlContent += `
        <h2>Alertas de Descarga Ativos</h2>
        <table>
          <thead>
            <tr>
              <th>Modalidade</th>
              <th>Prêmio</th>
              <th>Valor Atual (R$)</th>
              <th>Limite (R$)</th>
              <th>Excedente (R$)</th>
              <th>Data do Alerta</th>
            </tr>
          </thead>
          <tbody>
      `

      alertasAtivos.forEach((alerta) => {
        const dataAlerta = new Date(alerta.createdAt).toLocaleString('pt-BR')
        htmlContent += `
            <tr>
              <td>${alerta.modalidade}</td>
              <td>${alerta.premio}º Prêmio</td>
              <td class="valor">R$ ${alerta.valorAtual.toFixed(2)}</td>
              <td>R$ ${alerta.limite.toFixed(2)}</td>
              <td class="excedente">R$ ${alerta.excedente.toFixed(2)}</td>
              <td>${dataAlerta}</td>
            </tr>
        `
      })

      htmlContent += `
          </tbody>
        </table>
      `
    }

    // Resumo
    const totalLimitesAtivos = limites.filter((l) => l.ativo).length
    const totalValorLimites = limites.reduce((sum, l) => sum + l.limite, 0)
    const totalExcedente = alertasAtivos.reduce((sum, a) => sum + a.excedente, 0)

    htmlContent += `
        <div class="resumo">
          <h2>Resumo</h2>
          <p><strong>Limites Ativos:</strong> ${totalLimitesAtivos}</p>
          <p><strong>Total em Limites:</strong> R$ ${totalValorLimites.toFixed(2)}</p>
          <p><strong>Total em Excedentes:</strong> <span class="excedente">R$ ${totalExcedente.toFixed(2)}</span></p>
        </div>
      </body>
      </html>
    `

    // Abrir nova janela e imprimir
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(htmlContent)
      printWindow.document.close()
      printWindow.focus()
      
      // Aguardar um pouco antes de imprimir para garantir que o conteúdo foi carregado
      setTimeout(() => {
        printWindow.print()
      }, 250)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Carregando...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Controle de Descarga</h1>
        <div className="flex gap-3">
          <button
            onClick={exportarPDF}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <span className="text-xl">📄</span>
            Exportar PDF
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            {showForm ? 'Cancelar' : '+ Novo Limite'}
          </button>
        </div>
      </div>

      {/* Formulário de Novo Limite */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Definir Novo Limite</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Modalidade
              </label>
              <select
                value={formData.modalidade}
                onChange={(e) => setFormData({ ...formData, modalidade: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue focus:border-blue"
                required
              >
                <option value="">Selecione uma modalidade</option>
                {MODALIDADES.map((mod) => (
                  <option key={mod} value={mod}>
                    {mod}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prêmio
              </label>
              <select
                value={formData.premio}
                onChange={(e) => setFormData({ ...formData, premio: Number(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue focus:border-blue"
                required
              >
                <option value={1}>1º Prêmio</option>
                <option value={2}>2º Prêmio</option>
                <option value={3}>3º Prêmio</option>
                <option value={4}>4º Prêmio</option>
                <option value={5}>5º Prêmio</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Limite (R$)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.limite}
                onChange={(e) => setFormData({ ...formData, limite: Number(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue focus:border-blue"
                placeholder="0.00"
                required
              />
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                className="bg-blue text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Salvar Limite
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  setFormData({ modalidade: '', premio: 1, limite: 0 })
                }}
                className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Alertas */}
      {alertas.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-red-800 mb-4">
            ⚠️ Alertas de Descarga ({alertas.length})
          </h2>
          <div className="space-y-3">
            {alertas.map((alerta) => (
              <div
                key={alerta.id}
                className="bg-white rounded-lg p-4 border border-red-300 flex justify-between items-center"
              >
                <div>
                  <p className="font-semibold text-gray-900">
                    {alerta.modalidade} - {alerta.premio}º Prêmio
                  </p>
                  <p className="text-sm text-gray-600">
                    Valor atual: <strong>R$ {alerta.valorAtual.toFixed(2)}</strong> | Limite:{' '}
                    <strong>R$ {alerta.limite.toFixed(2)}</strong>
                  </p>
                  <p className="text-sm text-red-600 font-semibold">
                    Excedente: R$ {alerta.excedente.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Criado em: {new Date(alerta.createdAt).toLocaleString('pt-BR')}
                  </p>
                </div>
                <button
                  onClick={() => resolverAlerta(alerta.id)}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Resolver
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Limites Cadastrados */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Limites Cadastrados</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Modalidade
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Prêmio
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Limite (R$)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {limites.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    Nenhum limite cadastrado. Clique em "Novo Limite" para criar um.
                  </td>
                </tr>
              ) : (
                limites.map((limite) => (
                  <tr key={limite.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {limite.modalidade}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {limite.premio}º Prêmio
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      R$ {limite.limite.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => toggleLimite(limite.id, limite.ativo)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          limite.ativo
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {limite.ativo ? 'Ativo' : 'Inativo'}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => {
                          setFormData({
                            modalidade: limite.modalidade,
                            premio: limite.premio,
                            limite: limite.limite,
                          })
                          setShowForm(true)
                        }}
                        className="text-blue hover:text-blue-700"
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
