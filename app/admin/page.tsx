'use client'

import { useEffect, useState } from 'react'
import { useConfiguracoes } from '@/hooks/useConfiguracoes'
import Image from 'next/image'

interface DashboardStats {
  totalUsuarios: number
  novosUsuarios: number
  totalDepositos: number
  qtdDepositos: number
  totalSaques: number
  qtdSaques: number
  totalApostas: number
  qtdApostas: number
  premiosPagos: number
  receitaLiquida: number
}

interface DashboardDetalhes {
  apostasPorStatus: {
    pendente: number
    ganhou: number
    perdeu: number
    liquidado: number
  }
  saquesPorStatus: {
    pendente: number
    aprovado: number
    processando: number
    rejeitado: number
  }
}

export default function AdminDashboard() {
  const { configuracoes } = useConfiguracoes()
  const [stats, setStats] = useState<DashboardStats>({
    totalUsuarios: 0,
    novosUsuarios: 0,
    totalDepositos: 0,
    qtdDepositos: 0,
    totalSaques: 0,
    qtdSaques: 0,
    totalApostas: 0,
    qtdApostas: 0,
    premiosPagos: 0,
    receitaLiquida: 0,
  })
  const [detalhes, setDetalhes] = useState<DashboardDetalhes>({
    apostasPorStatus: { pendente: 0, ganhou: 0, perdeu: 0, liquidado: 0 },
    saquesPorStatus: { pendente: 0, aprovado: 0, processando: 0, rejeitado: 0 },
  })
  const [loading, setLoading] = useState(true)
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')

  useEffect(() => {
    loadStats()
  }, [dataInicio, dataFim])

  const loadStats = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (dataInicio) params.append('dataInicio', dataInicio)
      if (dataFim) params.append('dataFim', dataFim)

      const response = await fetch(`/api/admin/dashboard?${params.toString()}`)
      const data = await response.json()

      if (data.stats) {
        setStats(data.stats)
      }
      if (data.detalhes) {
        setDetalhes(data.detalhes)
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  const exportToPDF = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const periodo = dataInicio && dataFim 
      ? `Período: ${new Date(dataInicio).toLocaleDateString('pt-BR')} até ${new Date(dataFim).toLocaleDateString('pt-BR')}`
      : 'Período: Todos os dados'

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Relatório - ${configuracoes.nomePlataforma}</title>
          <style>
            @page { margin: 20mm; }
            body {
              font-family: Arial, sans-serif;
              color: #1C1C1C;
              background: white;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              padding-bottom: 20px;
              border-bottom: 3px solid #0066CC;
            }
            .logo {
              max-width: 200px;
              margin: 0 auto 10px;
            }
            h1 {
              color: #0066CC;
              margin: 10px 0;
            }
            .periodo {
              color: #666;
              font-size: 14px;
            }
            .stats-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 20px;
              margin: 30px 0;
            }
            .stat-card {
              background: #f5f5f5;
              padding: 20px;
              border-radius: 8px;
              border-left: 4px solid #0066CC;
            }
            .stat-label {
              font-size: 14px;
              color: #666;
              margin-bottom: 5px;
            }
            .stat-value {
              font-size: 24px;
              font-weight: bold;
              color: #1C1C1C;
            }
            .stat-value.positive { color: #F59E0B; }
            .stat-value.negative { color: #EF4444; }
            .stat-subtitle {
              font-size: 12px;
              color: #666;
              margin-top: 5px;
            }
            .detalhes {
              margin-top: 30px;
            }
            .detalhes h2 {
              color: #0066CC;
              margin-bottom: 15px;
            }
            .detalhes-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            .detalhes-table th,
            .detalhes-table td {
              padding: 10px;
              text-align: left;
              border-bottom: 1px solid #ddd;
            }
            .detalhes-table th {
              background: #0066CC;
              color: white;
            }
            .footer {
              margin-top: 40px;
              text-align: center;
              color: #666;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            ${configuracoes.logoSite ? `<img src="${configuracoes.logoSite}" alt="${configuracoes.nomePlataforma}" class="logo" />` : '<h1>🦁 ' + configuracoes.nomePlataforma + '</h1>'}
            <h2>Relatório Administrativo</h2>
            <div class="periodo">${periodo}</div>
            <div class="periodo">Gerado em: ${new Date().toLocaleString('pt-BR')}</div>
          </div>

          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-label">Total de Usuários</div>
              <div class="stat-value positive">${stats.totalUsuarios}</div>
              <div class="stat-subtitle">Novos: ${stats.novosUsuarios}</div>
            </div>

            <div class="stat-card">
              <div class="stat-label">Total de Depósitos</div>
              <div class="stat-value positive">${formatCurrency(stats.totalDepositos)}</div>
              <div class="stat-subtitle">${stats.qtdDepositos} depósitos</div>
            </div>

            <div class="stat-card">
              <div class="stat-label">Total de Saques</div>
              <div class="stat-value ${stats.totalSaques === 0 ? 'positive' : 'negative'}">${formatCurrency(stats.totalSaques)}</div>
              <div class="stat-subtitle">${stats.qtdSaques} saques</div>
            </div>

            <div class="stat-card">
              <div class="stat-label">Total de Apostas</div>
              <div class="stat-value positive">${formatCurrency(stats.totalApostas)}</div>
              <div class="stat-subtitle">${stats.qtdApostas} apostas</div>
            </div>

            <div class="stat-card">
              <div class="stat-label">Prêmios Pagos</div>
              <div class="stat-value negative">${formatCurrency(stats.premiosPagos)}</div>
            </div>

            <div class="stat-card">
              <div class="stat-label">Receita Líquida</div>
              <div class="stat-value ${stats.receitaLiquida >= 0 ? 'positive' : 'negative'}">${formatCurrency(stats.receitaLiquida)}</div>
            </div>
          </div>

          <div class="detalhes">
            <h2>Detalhes das Apostas</h2>
            <table class="detalhes-table">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Quantidade</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Pendente</td>
                  <td>${detalhes.apostasPorStatus.pendente}</td>
                </tr>
                <tr>
                  <td>Ganhou</td>
                  <td>${detalhes.apostasPorStatus.ganhou}</td>
                </tr>
                <tr>
                  <td>Perdeu</td>
                  <td>${detalhes.apostasPorStatus.perdeu}</td>
                </tr>
                <tr>
                  <td>Liquidado</td>
                  <td>${detalhes.apostasPorStatus.liquidado}</td>
                </tr>
              </tbody>
            </table>

            <h2>Detalhes dos Saques</h2>
            <table class="detalhes-table">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Quantidade</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Pendente</td>
                  <td>${detalhes.saquesPorStatus.pendente}</td>
                </tr>
                <tr>
                  <td>Aprovado</td>
                  <td>${detalhes.saquesPorStatus.aprovado}</td>
                </tr>
                <tr>
                  <td>Processando</td>
                  <td>${detalhes.saquesPorStatus.processando}</td>
                </tr>
                <tr>
                  <td>Rejeitado</td>
                  <td>${detalhes.saquesPorStatus.rejeitado}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="footer">
            <p>${configuracoes.nomePlataforma} - Sistema de Gestão</p>
            <p>Este relatório foi gerado automaticamente pelo sistema.</p>
          </div>
        </body>
      </html>
    `

    printWindow.document.write(htmlContent)
    printWindow.document.close()
    printWindow.focus()
    
    setTimeout(() => {
      printWindow.print()
    }, 250)
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <button
          onClick={exportToPDF}
          className="flex items-center gap-2 rounded-lg bg-blue px-4 py-2 text-white font-semibold hover:bg-blue-700 transition-colors"
        >
          <span>📄</span>
          <span>Exportar PDF</span>
        </button>
      </div>

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

      {loading ? (
        <div className="text-center py-12">
          <div className="text-gray-600">Carregando estatísticas...</div>
        </div>
      ) : (
        <>
          {/* Cards de Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {/* Total de Usuários */}
            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue">
              <div className="flex items-center justify-between mb-2">
                <p className="text-gray-600 text-sm">Total de Usuários</p>
                <span className="text-2xl">👥</span>
              </div>
              <p className="text-3xl font-bold text-yellow-500">{stats.totalUsuarios}</p>
              <p className="text-sm text-gray-500 mt-1">Novos: {stats.novosUsuarios}</p>
            </div>

            {/* Total de Depósitos */}
            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
              <div className="flex items-center justify-between mb-2">
                <p className="text-gray-600 text-sm">Total de Depósitos</p>
                <span className="text-2xl">💰</span>
              </div>
              <p className="text-3xl font-bold text-yellow-500">{formatCurrency(stats.totalDepositos)}</p>
              <p className="text-sm text-gray-500 mt-1">{stats.qtdDepositos} depósitos</p>
            </div>

            {/* Total de Saques */}
            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-red-500">
              <div className="flex items-center justify-between mb-2">
                <p className="text-gray-600 text-sm">Total de Saques</p>
                <span className="text-2xl">💳</span>
              </div>
              <p className={`text-3xl font-bold ${stats.totalSaques === 0 ? 'text-yellow-500' : 'text-red-500'}`}>
                {formatCurrency(stats.totalSaques)}
              </p>
              <p className="text-sm text-gray-500 mt-1">{stats.qtdSaques} saques</p>
            </div>

            {/* Total de Apostas */}
            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue">
              <div className="flex items-center justify-between mb-2">
                <p className="text-gray-600 text-sm">Total de Apostas</p>
                <span className="text-2xl">🎲</span>
              </div>
              <p className="text-3xl font-bold text-yellow-500">{formatCurrency(stats.totalApostas)}</p>
              <p className="text-sm text-gray-500 mt-1">{stats.qtdApostas} apostas</p>
            </div>

            {/* Prêmios Pagos */}
            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-red-500">
              <div className="flex items-center justify-between mb-2">
                <p className="text-gray-600 text-sm">Prêmios Pagos</p>
                <span className="text-2xl">🏆</span>
              </div>
              <p className="text-3xl font-bold text-red-500">{formatCurrency(stats.premiosPagos)}</p>
            </div>

            {/* Receita Líquida */}
            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500">
              <div className="flex items-center justify-between mb-2">
                <p className="text-gray-600 text-sm">Receita Líquida</p>
                <span className="text-2xl">📊</span>
              </div>
              <p className={`text-3xl font-bold ${stats.receitaLiquida >= 0 ? 'text-yellow-500' : 'text-red-500'}`}>
                {formatCurrency(stats.receitaLiquida)}
              </p>
            </div>
          </div>

          {/* Detalhes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Detalhes das Apostas */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Detalhes das Apostas</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-gray-700">Pendente</span>
                  <span className="font-semibold text-gray-900">{detalhes.apostasPorStatus.pendente}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-gray-700">Ganhou</span>
                  <span className="font-semibold text-green-600">{detalhes.apostasPorStatus.ganhou}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-gray-700">Perdeu</span>
                  <span className="font-semibold text-red-600">{detalhes.apostasPorStatus.perdeu}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-700">Liquidado</span>
                  <span className="font-semibold text-blue">{detalhes.apostasPorStatus.liquidado}</span>
                </div>
              </div>
            </div>

            {/* Detalhes dos Saques */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Detalhes dos Saques</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-gray-700">Pendente</span>
                  <span className="font-semibold text-yellow-600">{detalhes.saquesPorStatus.pendente}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-gray-700">Aprovado</span>
                  <span className="font-semibold text-green-600">{detalhes.saquesPorStatus.aprovado}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-gray-700">Processando</span>
                  <span className="font-semibold text-blue">{detalhes.saquesPorStatus.processando}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-700">Rejeitado</span>
                  <span className="font-semibold text-red-600">{detalhes.saquesPorStatus.rejeitado}</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
