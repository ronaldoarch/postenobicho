'use client'

import { useEffect, useState } from 'react'
import AlertaBonito from '@/components/AlertaBonito'
import { useAlerta } from '@/hooks/useAlerta'

interface Usuario {
  id: number
  nome: string
  email: string
  telefone: string
  saldo: number
  bonus: number
  bonusBloqueado: number
  ativo: boolean
  createdAt: string
}

export default function UsuariosPage() {
  const { alerta, sucesso, erro, fecharAlerta } = useAlerta()
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [showSaldoModal, setShowSaldoModal] = useState(false)
  const [usuarioSelecionado, setUsuarioSelecionado] = useState<Usuario | null>(null)
  const [valorSaldo, setValorSaldo] = useState('')
  const [descricaoSaldo, setDescricaoSaldo] = useState('')
  const [adicionandoSaldo, setAdicionandoSaldo] = useState(false)

  useEffect(() => {
    loadUsuarios()
  }, [])

  const loadUsuarios = async () => {
    try {
      const response = await fetch('/api/admin/usuarios')
      const data = await response.json()
      setUsuarios(data.usuarios || [])
    } catch (error) {
      console.error('Erro ao carregar usuários:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleActive = async (id: number, ativo: boolean) => {
    try {
      await fetch('/api/admin/usuarios', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ativo: !ativo }),
      })
      loadUsuarios()
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error)
    }
  }

  const deleteUsuario = async (id: number) => {
    if (!confirm('Tem certeza que deseja deletar este usuário?')) return

    try {
      await fetch(`/api/admin/usuarios?id=${id}`, { method: 'DELETE' })
      loadUsuarios()
    } catch (error) {
      console.error('Erro ao deletar usuário:', error)
    }
  }

  const abrirModalSaldo = (usuario: Usuario) => {
    setUsuarioSelecionado(usuario)
    setValorSaldo('')
    setDescricaoSaldo('')
    setShowSaldoModal(true)
  }

  const fecharModalSaldo = () => {
    setShowSaldoModal(false)
    setUsuarioSelecionado(null)
    setValorSaldo('')
    setDescricaoSaldo('')
  }

  const adicionarSaldo = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!usuarioSelecionado) return

    const valor = parseFloat(valorSaldo.replace(',', '.'))
    if (!valor || isNaN(valor) || valor <= 0) {
      erro('Valor Inválido', 'Digite um valor válido maior que zero')
      return
    }

    setAdicionandoSaldo(true)
    try {
      const response = await fetch(`/api/admin/usuarios/${usuarioSelecionado.id}/saldo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          valor,
          descricao: descricaoSaldo || `Depósito manual via admin`,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        sucesso(
          'Saldo Adicionado',
          `R$ ${valor.toFixed(2)} adicionados com sucesso!\nSaldo anterior: R$ ${data.usuario.saldoAnterior.toFixed(2)}\nNovo saldo: R$ ${data.usuario.saldoNovo.toFixed(2)}`
        )
        fecharModalSaldo()
        loadUsuarios()
      } else {
        erro('Erro ao Adicionar Saldo', data.error || 'Não foi possível adicionar o saldo')
      }
    } catch (error) {
      console.error('Erro ao adicionar saldo:', error)
      erro('Erro ao Adicionar Saldo', 'Ocorreu um erro ao adicionar o saldo')
    } finally {
      setAdicionandoSaldo(false)
    }
  }

  // Calcular totais
  const totalSaldo = usuarios.reduce((sum, u) => sum + (u.saldo || 0), 0)
  const totalBonus = usuarios.reduce((sum, u) => sum + (u.bonus || 0), 0)
  const totalBonusBloqueado = usuarios.reduce((sum, u) => sum + (u.bonusBloqueado || 0), 0)

  if (loading) {
    return <div className="text-center py-8">Carregando...</div>
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Gerenciar Usuários</h1>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Telefone</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Saldo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {usuarios.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                  Nenhum usuário cadastrado
                </td>
              </tr>
            ) : (
              usuarios.map((usuario) => (
                <tr key={usuario.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{usuario.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{usuario.nome}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{usuario.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{usuario.telefone}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    R$ {usuario.saldo?.toFixed(2) || '0.00'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => toggleActive(usuario.id, usuario.ativo)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        usuario.ativo
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {usuario.ativo ? 'Ativo' : 'Inativo'}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => abrirModalSaldo(usuario)}
                      className="text-green-600 hover:text-green-700 mr-4 font-semibold"
                    >
                      Adicionar Saldo
                    </button>
                    <button
                      onClick={() => toggleActive(usuario.id, usuario.ativo)}
                      className="text-blue hover:text-blue-700 mr-4"
                    >
                      {usuario.ativo ? 'Desativar' : 'Ativar'}
                    </button>
                    <button
                      onClick={() => deleteUsuario(usuario.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Deletar
                    </button>
                  </td>
                </tr>
              ))
            )}
            {/* Linha de Total */}
            {usuarios.length > 0 && (
              <>
                <tr className="border-t-2 border-gray-300 bg-gray-50">
                  <td colSpan={4} className="px-6 py-4 text-right text-sm font-bold text-gray-700">
                    TOTAL GERAL:
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                    R$ {totalSaldo.toFixed(2)}
                  </td>
                  <td colSpan={2} className="px-6 py-4"></td>
                </tr>
                <tr className="bg-blue-50 border-t border-blue-200">
                  <td colSpan={4} className="px-6 py-3 text-right text-sm font-semibold text-blue-800">
                    Saldo Real Total:
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm font-bold text-blue-900">
                    R$ {totalSaldo.toFixed(2)}
                  </td>
                  <td colSpan={2} className="px-6 py-3"></td>
                </tr>
                <tr className="bg-yellow-50 border-t border-yellow-200">
                  <td colSpan={4} className="px-6 py-3 text-right text-sm font-semibold text-yellow-800">
                    Bônus Total:
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm font-bold text-yellow-900">
                    R$ {totalBonus.toFixed(2)}
                  </td>
                  <td colSpan={2} className="px-6 py-3"></td>
                </tr>
                <tr className="bg-orange-50 border-t border-orange-200">
                  <td colSpan={4} className="px-6 py-3 text-right text-sm font-semibold text-orange-800">
                    Bônus Bloqueado Total:
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm font-bold text-orange-900">
                    R$ {totalBonusBloqueado.toFixed(2)}
                  </td>
                  <td colSpan={2} className="px-6 py-3"></td>
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal para adicionar saldo */}
      {showSaldoModal && usuarioSelecionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center text-2xl">
                  💰
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Adicionar Saldo</h2>
                  <p className="text-sm text-green-100">{usuarioSelecionado.nome}</p>
                </div>
              </div>
            </div>

            {/* Conteúdo */}
            <form onSubmit={adicionarSaldo} className="px-6 py-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Saldo Atual
                </label>
                <div className="text-2xl font-bold text-gray-900">
                  R$ {usuarioSelecionado.saldo?.toFixed(2) || '0.00'}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valor a Adicionar *
                </label>
                <input
                  type="text"
                  value={valorSaldo}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^\d,.-]/g, '')
                    setValorSaldo(value)
                  }}
                  placeholder="0,00"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-lg"
                  required
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição (opcional)
                </label>
                <textarea
                  value={descricaoSaldo}
                  onChange={(e) => setDescricaoSaldo(e.target.value)}
                  placeholder="Ex: Depósito manual, Bônus promocional, etc."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  rows={3}
                />
              </div>

              {/* Botões */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={fecharModalSaldo}
                  className="flex-1 px-6 py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={adicionandoSaldo}
                  className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
                >
                  {adicionandoSaldo ? 'Adicionando...' : 'Adicionar Saldo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
