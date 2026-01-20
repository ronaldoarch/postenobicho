'use client'

import { useEffect, useState } from 'react'
import { useConfiguracoes } from '@/hooks/useConfiguracoes'
import AlertaBonito from '@/components/AlertaBonito'
import ConfirmacaoBonita from '@/components/ConfirmacaoBonita'
import { useAlerta } from '@/hooks/useAlerta'
import { useConfirmacao } from '@/hooks/useConfirmacao'

interface ApostaPendente {
  id: number
  usuarioId: number
  usuario: {
    nome: string
    email: string
  }
  loteria: string | null
  estado: string | null
  horario: string | null
  dataConcurso: Date | null
  modalidade: string | null
  aposta: string | null
  valor: number
  retornoPrevisto: number
  detalhes: any
}

interface ResultadoManual {
  loteria: string
  dataConcurso: string
  horario: string
  premios: string[] // Array de 7 prêmios (milhares)
}

export default function LiquidacaoPage() {
  const { configuracoes } = useConfiguracoes()
  const { alerta, sucesso, erro, fecharAlerta } = useAlerta()
  const { confirmacao, mostrarConfirmacao, fecharConfirmacao, confirmar } = useConfirmacao()
  const [apostasPendentes, setApostasPendentes] = useState<ApostaPendente[]>([])
  const [loading, setLoading] = useState(true)
  const [liquidadas, setLiquidadas] = useState(0)
  const [processando, setProcessando] = useState(false)
  const [resultadoManual, setResultadoManual] = useState<ResultadoManual>({
    loteria: '',
    dataConcurso: new Date().toISOString().split('T')[0],
    horario: '',
    premios: ['', '', '', '', '', '', ''],
  })

  useEffect(() => {
    loadApostasPendentes()
  }, [])

  const loadApostasPendentes = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/apostas?status=pendente')
      const data = await response.json()
      setApostasPendentes(data.apostas || [])
    } catch (error) {
      console.error('Erro ao carregar apostas:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLiquidarManual = async () => {
    if (!resultadoManual.loteria || !resultadoManual.dataConcurso || !resultadoManual.horario) {
      erro('Campos Obrigatórios', 'Preencha loteria, data e horário')
      return
    }

    const premiosValidos = resultadoManual.premios.filter((p) => p.trim() !== '')
    if (premiosValidos.length === 0) {
      erro('Campos Obrigatórios', 'Preencha pelo menos um prêmio')
      return
    }

    mostrarConfirmacao(
      'Confirmar Liquidação Manual',
      `Confirma liquidação manual para ${resultadoManual.loteria} - ${resultadoManual.dataConcurso} ${resultadoManual.horario}?`,
      () => executarLiquidacaoManual(premiosValidos),
      'info'
    )
  }

  const executarLiquidacaoManual = async (premiosValidos: string[]) => {
    setProcessando(true)
    try {
      const response = await fetch('/api/resultados/liquidar/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loteria: resultadoManual.loteria,
          dataConcurso: resultadoManual.dataConcurso,
          horario: resultadoManual.horario,
          premios: premiosValidos,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        sucesso(
          'Liquidação Concluída',
          `Processadas: ${data.processadas}\nLiquidadas: ${data.liquidadas}\nPrêmio Total: R$ ${data.premioTotal?.toFixed(2) || '0.00'}`
        )
        setLiquidadas(data.liquidadas || 0)
        loadApostasPendentes()
        // Limpar formulário
        setResultadoManual({
          loteria: '',
          dataConcurso: new Date().toISOString().split('T')[0],
          horario: '',
          premios: ['', '', '', '', '', '', ''],
        })
      } else {
        erro('Erro na Liquidação', data.error || 'Erro ao liquidar')
      }
    } catch (error) {
      console.error('Erro ao liquidar:', error)
      erro('Erro na Liquidação', 'Erro ao executar liquidação manual')
    } finally {
      setProcessando(false)
    }
  }

  const handleLiquidarAutomatica = async () => {
    mostrarConfirmacao(
      'Confirmar Liquidação Automática',
      'Confirma execução de liquidação automática? Isso irá processar todas as apostas pendentes com resultados disponíveis.',
      () => executarLiquidacaoAutomatica(),
      'info'
    )
  }

  const executarLiquidacaoAutomatica = async () => {

    setProcessando(true)
    try {
      const response = await fetch('/api/resultados/liquidar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usarMonitor: false }),
      })

      const data = await response.json()

      if (response.ok) {
        if (data.desativada) {
          erro('Liquidação Desativada', 'Liquidação automática está desativada nas configurações. Use a liquidação manual abaixo.')
        } else {
          sucesso(
            'Liquidação Concluída',
            `Processadas: ${data.processadas}\nLiquidadas: ${data.liquidadas}\nPrêmio Total: R$ ${data.premioTotal?.toFixed(2) || '0.00'}`
          )
          setLiquidadas(data.liquidadas || 0)
          loadApostasPendentes()
        }
      } else {
        erro('Erro na Liquidação', data.error || 'Erro ao liquidar')
      }
    } catch (error) {
      console.error('Erro ao liquidar:', error)
      erro('Erro na Liquidação', 'Erro ao executar liquidação automática')
    } finally {
      setProcessando(false)
    }
  }

  // Agrupar apostas por loteria/data/horário
  const apostasAgrupadas = apostasPendentes.reduce((acc, aposta) => {
    const key = `${aposta.loteria || 'N/A'}|${aposta.dataConcurso ? new Date(aposta.dataConcurso).toISOString().split('T')[0] : 'N/A'}|${aposta.horario || 'N/A'}`
    if (!acc[key]) {
      acc[key] = []
    }
    acc[key].push(aposta)
    return acc
  }, {} as Record<string, ApostaPendente[]>)

  if (loading) {
    return <div className="text-center py-8">Carregando...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Liquidação de Apostas</h1>
          <p className="text-sm text-gray-600 mt-2">
            {configuracoes.liquidacaoAutomatica !== false
              ? '✅ Liquidação automática está ativada' 
              : '⚠️ Liquidação automática está desativada - Use liquidação manual'}
          </p>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="text-sm text-gray-600 mb-1">Apostas Pendentes</div>
          <div className="text-3xl font-bold text-yellow-600">{apostasPendentes.length}</div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="text-sm text-gray-600 mb-1">Grupos Únicos</div>
          <div className="text-3xl font-bold text-blue-600">{Object.keys(apostasAgrupadas).length}</div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="text-sm text-gray-600 mb-1">Valor Total Pendente</div>
          <div className="text-3xl font-bold text-gray-900">
            R$ {apostasPendentes.reduce((sum, a) => sum + a.valor, 0).toFixed(2)}
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="text-sm text-gray-600 mb-1">Últimas Liquidadas</div>
          <div className="text-3xl font-bold text-green-600">{liquidadas}</div>
        </div>
      </div>

      {/* Liquidação Automática */}
      {configuracoes.liquidacaoAutomatica !== false && (
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Liquidação Automática</h2>
          <p className="text-sm text-gray-600 mb-4">
            Processa todas as apostas pendentes usando resultados oficiais disponíveis.
          </p>
          <button
            onClick={handleLiquidarAutomatica}
            disabled={processando || apostasPendentes.length === 0}
            className="bg-blue text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processando ? 'Processando...' : 'Executar Liquidação Automática'}
          </button>
        </div>
      )}

      {/* Liquidação Manual */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Liquidação Manual</h2>
        <p className="text-sm text-gray-600 mb-4">
          Preencha os resultados manualmente para liquidar apostas específicas.
        </p>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Loteria/Extração</label>
              <input
                type="text"
                value={resultadoManual.loteria}
                onChange={(e) => setResultadoManual({ ...resultadoManual, loteria: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue focus:border-transparent"
                placeholder="Ex: PT RIO"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Data do Concurso</label>
              <input
                type="date"
                value={resultadoManual.dataConcurso}
                onChange={(e) => setResultadoManual({ ...resultadoManual, dataConcurso: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Horário</label>
              <input
                type="text"
                value={resultadoManual.horario}
                onChange={(e) => setResultadoManual({ ...resultadoManual, horario: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue focus:border-transparent"
                placeholder="Ex: 11:30"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Prêmios (Milhares - 4 dígitos cada)</label>
            <div className="grid grid-cols-7 gap-2">
              {resultadoManual.premios.map((premio, index) => (
                <div key={index}>
                  <label className="block text-xs text-gray-600 mb-1">{index + 1}º</label>
                  <input
                    type="text"
                    value={premio}
                    onChange={(e) => {
                      const novoPremios = [...resultadoManual.premios]
                      novoPremios[index] = e.target.value.replace(/\D/g, '').slice(0, 4)
                      setResultadoManual({ ...resultadoManual, premios: novoPremios })
                    }}
                    className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue focus:border-transparent text-center"
                    placeholder="0000"
                    maxLength={4}
                  />
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Preencha os prêmios na ordem (1º, 2º, 3º, etc.). Pode preencher apenas os primeiros prêmios se necessário.
            </p>
          </div>

          <button
            onClick={handleLiquidarManual}
            disabled={processando}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processando ? 'Processando...' : 'Liquidar com Resultados Manuais'}
          </button>
        </div>
      </div>

      {/* Lista de Apostas Pendentes Agrupadas */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Apostas Pendentes Agrupadas</h2>
        </div>
        <div className="overflow-x-auto">
          {Object.keys(apostasAgrupadas).length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              Nenhuma aposta pendente encontrada.
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {Object.entries(apostasAgrupadas).map(([key, apostas]) => {
                const [loteria, data, horario] = key.split('|')
                return (
                  <div key={key} className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {loteria} - {data} {horario}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {apostas.length} aposta(s) pendente(s) | Total: R$ {apostas.reduce((sum, a) => sum + a.valor, 0).toFixed(2)}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setResultadoManual({
                            loteria: loteria !== 'N/A' ? loteria : '',
                            dataConcurso: data !== 'N/A' ? data : new Date().toISOString().split('T')[0],
                            horario: horario !== 'N/A' ? horario : '',
                            premios: ['', '', '', '', '', '', ''],
                          })
                          window.scrollTo({ top: 0, behavior: 'smooth' })
                        }}
                        className="text-blue hover:text-blue-700 text-sm font-medium"
                      >
                        Usar para Liquidação Manual
                      </button>
                    </div>
                    <div className="space-y-2">
                      {apostas.slice(0, 5).map((aposta) => (
                        <div key={aposta.id} className="bg-gray-50 rounded-lg p-3 text-sm">
                          <div className="flex justify-between">
                            <span className="font-medium">{aposta.usuario.nome}</span>
                            <span className="text-gray-600">R$ {aposta.valor.toFixed(2)}</span>
                          </div>
                          <div className="text-gray-600 mt-1">
                            {aposta.modalidade} | {aposta.aposta}
                          </div>
                        </div>
                      ))}
                      {apostas.length > 5 && (
                        <div className="text-sm text-gray-500 text-center">
                          ... e mais {apostas.length - 5} aposta(s)
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Alertas bonitos */}
      {alerta && (
        <AlertaBonito
          isOpen={!!alerta}
          onClose={fecharAlerta}
          tipo={alerta.tipo}
          titulo={alerta.titulo}
          mensagem={alerta.mensagem}
        />
      )}

      {/* Confirmação bonita */}
      {confirmacao && (
        <ConfirmacaoBonita
          isOpen={!!confirmacao}
          onClose={fecharConfirmacao}
          onConfirm={confirmar}
          titulo={confirmacao.titulo}
          mensagem={confirmacao.mensagem}
          textoConfirmar={confirmacao.textoConfirmar}
          textoCancelar={confirmacao.textoCancelar}
          tipo={confirmacao.tipo}
        />
      )}
    </div>
  )
}
