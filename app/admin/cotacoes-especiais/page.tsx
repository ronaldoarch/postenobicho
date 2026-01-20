'use client'

import { useEffect, useState } from 'react'
import AlertaBonito from '@/components/AlertaBonito'
import ConfirmacaoBonita from '@/components/ConfirmacaoBonita'
import { useAlerta } from '@/hooks/useAlerta'
import { useConfirmacao } from '@/hooks/useConfirmacao'

interface CotacaoEspecial {
  id: number
  tipo: 'milhar' | 'centena'
  numero: string
  cotacao: number | null
  ativo: boolean
  createdAt: string
  updatedAt: string
}

export default function CotacoesEspeciaisPage() {
  const { alerta, sucesso, erro, fecharAlerta } = useAlerta()
  const { confirmacao, mostrarConfirmacao, fecharConfirmacao, confirmar } = useConfirmacao()
  const [milhares, setMilhares] = useState<CotacaoEspecial[]>([])
  const [centenas, setCentenas] = useState<CotacaoEspecial[]>([])
  const [loading, setLoading] = useState(true)
  const [novoMilhar, setNovoMilhar] = useState({ numero: '', cotacao: '' })
  const [novaCentena, setNovaCentena] = useState({ numero: '', cotacao: '' })
  const [editando, setEditando] = useState<{ id: number; cotacao: number | null } | null>(null)

  useEffect(() => {
    loadCotacoes()
  }, [])

  const loadCotacoes = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/cotacoes-especiais')
      const data = await response.json()
      
      const cotacoes = data.cotacoes || []
      setMilhares(cotacoes.filter((c: CotacaoEspecial) => c.tipo === 'milhar'))
      setCentenas(cotacoes.filter((c: CotacaoEspecial) => c.tipo === 'centena'))
    } catch (error) {
      console.error('Erro ao carregar cotações:', error)
      erro('Erro ao Carregar', 'Não foi possível carregar as cotações')
    } finally {
      setLoading(false)
    }
  }

  const adicionarMilhar = async () => {
    if (!novoMilhar.numero || novoMilhar.numero.length !== 4) {
      erro('Formato Inválido', 'Milhar deve ter exatamente 4 dígitos')
      return
    }

    try {
      const response = await fetch('/api/admin/cotacoes-especiais', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: 'milhar',
          numero: novoMilhar.numero.padStart(4, '0'),
          cotacao: novoMilhar.cotacao ? parseFloat(novoMilhar.cotacao) : null,
        }),
      })

      if (response.ok) {
        setNovoMilhar({ numero: '', cotacao: '' })
        sucesso('Milhar Adicionada', 'Milhar cotada adicionada com sucesso!')
        loadCotacoes()
      } else {
        const error = await response.json()
        erro('Erro ao Adicionar', error.error || 'Erro ao adicionar milhar')
      }
    } catch (error) {
      console.error('Erro ao adicionar milhar:', error)
      erro('Erro ao Adicionar', 'Ocorreu um erro ao adicionar a milhar')
    }
  }

  const adicionarCentena = async () => {
    if (!novaCentena.numero || novaCentena.numero.length !== 3) {
      erro('Formato Inválido', 'Centena deve ter exatamente 3 dígitos')
      return
    }

    try {
      const response = await fetch('/api/admin/cotacoes-especiais', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: 'centena',
          numero: novaCentena.numero.padStart(3, '0'),
          cotacao: novaCentena.cotacao ? parseFloat(novaCentena.cotacao) : null,
        }),
      })

      if (response.ok) {
        setNovaCentena({ numero: '', cotacao: '' })
        sucesso('Centena Adicionada', 'Centena cotada adicionada com sucesso!')
        loadCotacoes()
      } else {
        const error = await response.json()
        erro('Erro ao Adicionar', error.error || 'Erro ao adicionar centena')
      }
    } catch (error) {
      console.error('Erro ao adicionar centena:', error)
      erro('Erro ao Adicionar', 'Ocorreu um erro ao adicionar a centena')
    }
  }

  const deletarCotacao = async (id: number) => {
    mostrarConfirmacao(
      'Confirmar Exclusão',
      'Tem certeza que deseja deletar esta cotação?',
      () => executarDeletarCotacao(id),
      'perigo'
    )
  }

  const executarDeletarCotacao = async (id: number) => {
    try {
      const response = await fetch(`/api/admin/cotacoes-especiais?id=${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        sucesso('Cotação Deletada', 'Cotação removida com sucesso!')
        loadCotacoes()
      } else {
        erro('Erro ao Deletar', 'Não foi possível deletar a cotação')
      }
    } catch (error) {
      console.error('Erro ao deletar cotação:', error)
      erro('Erro ao Deletar', 'Ocorreu um erro ao deletar a cotação')
    }
  }

  const toggleAtivo = async (id: number, ativo: boolean) => {
    try {
      const response = await fetch('/api/admin/cotacoes-especiais', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ativo: !ativo }),
      })

      if (response.ok) {
        loadCotacoes()
      } else {
        erro('Erro ao Atualizar', 'Não foi possível atualizar o status')
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      erro('Erro ao Atualizar', 'Ocorreu um erro ao atualizar o status')
    }
  }

  const salvarCotacao = async (id: number, cotacao: number | null) => {
    try {
      const response = await fetch('/api/admin/cotacoes-especiais', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, cotacao }),
      })

      if (response.ok) {
        sucesso('Cotação Salva', 'Cotação atualizada com sucesso!')
        setEditando(null)
        loadCotacoes()
      } else {
        const error = await response.json()
        erro('Erro ao Salvar', error.error || 'Erro ao salvar cotação')
      }
    } catch (error) {
      console.error('Erro ao salvar cotação:', error)
      erro('Erro ao Salvar', 'Ocorreu um erro ao salvar a cotação')
    }
  }

  if (loading) {
    return <div className="text-center py-8">Carregando...</div>
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Milhares e Centenas Cotadas</h1>
        <p className="text-sm text-gray-600 mt-2">
          Gerencie os números cotados e defina a cotação (multiplicador) para cada um.
        </p>
      </div>

      {/* Milhares */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Milhares</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-4">
          {milhares.map((milhar) => (
            <div
              key={milhar.id}
              className="border border-gray-300 rounded-lg p-3 flex items-center justify-between bg-gray-50"
            >
              <div className="flex-1">
                <div className="font-semibold text-gray-900">{milhar.numero}</div>
                {editando?.id === milhar.id ? (
                  <div className="mt-2 flex gap-2">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editando.cotacao ?? ''}
                      onChange={(e) =>
                        setEditando({
                          id: milhar.id,
                          cotacao: e.target.value ? parseFloat(e.target.value) : null,
                        })
                      }
                      className="w-20 px-2 py-1 text-sm border border-gray-300 rounded"
                      placeholder="Cotação"
                      autoFocus
                    />
                    <button
                      onClick={() => salvarCotacao(milhar.id, editando.cotacao)}
                      className="text-green-600 hover:text-green-700 text-sm"
                    >
                      ✓
                    </button>
                    <button
                      onClick={() => setEditando(null)}
                      className="text-red-600 hover:text-red-700 text-sm"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="text-xs text-gray-600 mt-1">
                    {milhar.cotacao !== null ? (
                      <span className="text-blue font-semibold">
                        Cotação: {milhar.cotacao}x
                      </span>
                    ) : (
                      <span className="text-gray-400">Sem cotação</span>
                    )}
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-1 ml-2">
                <button
                  onClick={() => setEditando({ id: milhar.id, cotacao: milhar.cotacao })}
                  className="text-blue hover:text-blue-700 text-xs"
                  title="Editar cotação"
                >
                  ✏️
                </button>
                <button
                  onClick={() => toggleAtivo(milhar.id, milhar.ativo)}
                  className={`text-xs ${milhar.ativo ? 'text-green-600' : 'text-gray-400'}`}
                  title={milhar.ativo ? 'Desativar' : 'Ativar'}
                >
                  {milhar.ativo ? '✓' : '○'}
                </button>
                <button
                  onClick={() => deletarCotacao(milhar.id)}
                  className="text-red-600 hover:text-red-700 text-xs"
                  title="Deletar"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={novoMilhar.numero}
            onChange={(e) =>
              setNovoMilhar({ ...novoMilhar, numero: e.target.value.replace(/\D/g, '').slice(0, 4) })
            }
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue focus:border-transparent"
            placeholder="0000"
            maxLength={4}
          />
          <input
            type="number"
            step="0.01"
            min="0"
            value={novoMilhar.cotacao}
            onChange={(e) => setNovoMilhar({ ...novoMilhar, cotacao: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue focus:border-transparent w-32"
            placeholder="Cotação (opcional)"
          />
          <button
            onClick={adicionarMilhar}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Adicionar
          </button>
        </div>
      </div>

      {/* Centenas */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Centenas</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-4">
          {centenas.map((centena) => (
            <div
              key={centena.id}
              className="border border-gray-300 rounded-lg p-3 flex items-center justify-between bg-gray-50"
            >
              <div className="flex-1">
                <div className="font-semibold text-gray-900">{centena.numero}</div>
                {editando?.id === centena.id ? (
                  <div className="mt-2 flex gap-2">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editando.cotacao ?? ''}
                      onChange={(e) =>
                        setEditando({
                          id: centena.id,
                          cotacao: e.target.value ? parseFloat(e.target.value) : null,
                        })
                      }
                      className="w-20 px-2 py-1 text-sm border border-gray-300 rounded"
                      placeholder="Cotação"
                      autoFocus
                    />
                    <button
                      onClick={() => salvarCotacao(centena.id, editando.cotacao)}
                      className="text-green-600 hover:text-green-700 text-sm"
                    >
                      ✓
                    </button>
                    <button
                      onClick={() => setEditando(null)}
                      className="text-red-600 hover:text-red-700 text-sm"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="text-xs text-gray-600 mt-1">
                    {centena.cotacao !== null ? (
                      <span className="text-blue font-semibold">
                        Cotação: {centena.cotacao}x
                      </span>
                    ) : (
                      <span className="text-gray-400">Sem cotação</span>
                    )}
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-1 ml-2">
                <button
                  onClick={() => setEditando({ id: centena.id, cotacao: centena.cotacao })}
                  className="text-blue hover:text-blue-700 text-xs"
                  title="Editar cotação"
                >
                  ✏️
                </button>
                <button
                  onClick={() => toggleAtivo(centena.id, centena.ativo)}
                  className={`text-xs ${centena.ativo ? 'text-green-600' : 'text-gray-400'}`}
                  title={centena.ativo ? 'Desativar' : 'Ativar'}
                >
                  {centena.ativo ? '✓' : '○'}
                </button>
                <button
                  onClick={() => deletarCotacao(centena.id)}
                  className="text-red-600 hover:text-red-700 text-xs"
                  title="Deletar"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={novaCentena.numero}
            onChange={(e) =>
              setNovaCentena({ ...novaCentena, numero: e.target.value.replace(/\D/g, '').slice(0, 3) })
            }
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue focus:border-transparent"
            placeholder="000"
            maxLength={3}
          />
          <input
            type="number"
            step="0.01"
            min="0"
            value={novaCentena.cotacao}
            onChange={(e) => setNovaCentena({ ...novaCentena, cotacao: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue focus:border-transparent w-32"
            placeholder="Cotação (opcional)"
          />
          <button
            onClick={adicionarCentena}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Adicionar
          </button>
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
