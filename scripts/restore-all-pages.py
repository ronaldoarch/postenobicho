#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para restaurar todas as páginas faltantes no servidor
Execute: python3 scripts/restore-all-pages.py
"""

import os
import json

# Definir base path
BASE_PATH = '/var/www/postenobicho'

# Páginas principais para restaurar
pages = {
    'app/login/page.tsx': """'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import BottomNav from '@/components/BottomNav'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao logar')
      }
      router.push('/minhas-apostas')
    } catch (err: any) {
      setError(err.message || 'Erro ao logar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-scale-100">
      <Header />
      <main className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-md rounded-xl bg-white p-6 shadow">
          <h1 className="mb-4 text-2xl font-bold text-gray-900">Entrar</h1>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="mb-1 block text-sm font-semibold text-gray-700">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-gray-700">Senha</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue focus:outline-none"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue px-4 py-2 font-semibold text-white transition-colors hover:bg-blue-scale-70 disabled:opacity-70"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
          <p className="mt-4 text-sm text-gray-600">
            Não tem conta?{' '}
            <a href="/cadastro" className="font-semibold text-blue hover:underline">
              Cadastre-se
            </a>
          </p>
        </div>
      </main>
      <Footer />
      <BottomNav />
    </div>
  )
}
""",
    
    'tailwind.config.js': """/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'blue': 'var(--tema-primaria)',
        'blue-scale': {
          '70': 'var(--tema-primaria)',
          '100': 'var(--tema-primaria)',
          '2-10': 'rgba(5, 35, 112, 0.1)',
        },
        'yellow': 'var(--tema-secundaria)',
        'yellow-50': 'color-mix(in srgb, var(--tema-secundaria) 50%, white)',
        'white-125': 'rgba(255, 255, 255, 0.125)',
        'gray-scale': {
          '100': 'var(--tema-fundo)',
          '700': 'var(--tema-texto-secundario)',
          '950': 'var(--tema-texto)',
        },
        'grey-scale': {
          '900': 'var(--tema-texto)',
        },
        'white-scale': {
          '0': 'var(--tema-fundo-secundario)',
        },
        'tema': {
          'primaria': 'var(--tema-primaria)',
          'secundaria': 'var(--tema-secundaria)',
          'acento': 'var(--tema-acento)',
          'sucesso': 'var(--tema-sucesso)',
          'texto': 'var(--tema-texto)',
          'texto-secundario': 'var(--tema-texto-secundario)',
          'fundo': 'var(--tema-fundo)',
          'fundo-secundario': 'var(--tema-fundo-secundario)',
        },
      },
      fontFamily: {
        'sora': ['Sora', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
""",
    
    'postcss.config.js': """module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
"""
}

def main():
    os.chdir(BASE_PATH)
    
    print("=== Restaurando arquivos faltantes ===\n")
    
    created = []
    errors = []
    
    for filepath, content in pages.items():
        try:
            # Criar diretório se não existir
            dir_path = os.path.dirname(filepath)
            if dir_path:
                os.makedirs(dir_path, exist_ok=True)
            
            # Verificar se arquivo já existe
            if os.path.exists(filepath):
                print(f"⚠️  {filepath} já existe, pulando...")
                continue
            
            # Escrever arquivo
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            
            created.append(filepath)
            print(f"✅ {filepath} criado")
        except Exception as e:
            errors.append((filepath, str(e)))
            print(f"❌ Erro ao criar {filepath}: {e}")
    
    print(f"\n=== Resumo ===")
    print(f"✅ Arquivos criados: {len(created)}")
    print(f"❌ Erros: {len(errors)}")
    
    if created:
        print(f"\nArquivos criados:")
        for f in created:
            print(f"  - {f}")
    
    if errors:
        print(f"\nErros:")
        for f, e in errors:
            print(f"  - {f}: {e}")

if __name__ == '__main__':
    main()
