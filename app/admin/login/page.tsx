'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useConfiguracoes } from '@/hooks/useConfiguracoes'
import Image from 'next/image'

export default function AdminLoginPage() {
  const router = useRouter()
  const { configuracoes } = useConfiguracoes()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Verificar se já está logado
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' })
        const data = await res.json()
        if (data.user) {
          router.push('/admin')
        }
      } catch (error) {
        // Não autenticado, continuar na página de login
      }
    }
    checkAuth()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Credenciais inválidas')
      }
      // Redirecionar para o dashboard admin
      router.push('/admin')
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue to-blue-800">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
        {/* Logo */}
        <div className="mb-6 flex flex-col items-center">
          {configuracoes.logoSite ? (
            <Image
              src={configuracoes.logoSite}
              alt={configuracoes.nomePlataforma}
              width={80}
              height={80}
              className="mb-4 object-contain"
            />
          ) : (
            <span className="mb-4 text-6xl">🦁</span>
          )}
          <h1 className="text-3xl font-bold text-gray-900">{configuracoes.nomePlataforma}</h1>
          <p className="mt-2 text-sm text-gray-600">Painel Administrativo</p>
        </div>

        {/* Formulário de Login */}
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="admin@postenobicho.com"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue focus:outline-none focus:ring-2 focus:ring-blue/20"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Digite sua senha"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue focus:outline-none focus:ring-2 focus:ring-blue/20"
            />
          </div>
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue px-4 py-3 font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? 'Entrando...' : 'Entrar no Painel'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <a
            href="/"
            className="text-sm text-gray-600 hover:text-blue transition-colors"
          >
            ← Voltar ao site
          </a>
        </div>
      </div>
    </div>
  )
}
