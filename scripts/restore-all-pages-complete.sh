#!/bin/bash
# Script completo para restaurar todas as páginas faltantes
# Execute no servidor: bash scripts/restore-all-pages-complete.sh

cd /var/www/postenobicho

echo "=== Restaurando todas as páginas faltantes ==="
echo ""

# Criar script Python que restaura todas as páginas
python3 << 'PYEOF'
import os
import json

os.chdir('/var/www/postenobicho')

# Ler conteúdo dos arquivos locais e criar no servidor
# Como não temos acesso direto aos arquivos locais, vamos criar baseado no que sabemos

pages_content = {
    'app/cadastro/page.tsx': """'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import BottomNav from '@/components/BottomNav'

export default function CadastroPage() {
  const router = useRouter()
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [telefone, setTelefone] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, email, telefone, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao cadastrar')
      }
      router.push('/minhas-apostas')
    } catch (err: any) {
      setError(err.message || 'Erro ao cadastrar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-scale-100">
      <Header />
      <main className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-md rounded-xl bg-white p-6 shadow">
          <h1 className="mb-4 text-2xl font-bold text-gray-900">Cadastro</h1>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="mb-1 block text-sm font-semibold text-gray-700">Nome</label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue focus:outline-none"
              />
            </div>
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
              <label className="mb-1 block text-sm font-semibold text-gray-700">Telefone</label>
              <input
                type="text"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
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
              {loading ? 'Cadastrando...' : 'Cadastrar'}
            </button>
          </form>
          <p className="mt-4 text-sm text-gray-600">
            Já tem conta?{' '}
            <a href="/login" className="font-semibold text-blue hover:underline">
              Entrar
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
    
    'app/apostar/page.tsx': """import Header from '@/components/Header'
import Footer from '@/components/Footer'
import BottomNav from '@/components/BottomNav'
import BetFlow from '@/components/BetFlow'
import PromotionalBanner from '@/components/PromotionalBanner'

export default function ApostarPage() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-scale-100">
      <Header />
      <main className="relative flex flex-1 flex-col overflow-auto bg-gray-scale-100 text-[#1C1C1C]">
        <div className="mx-auto flex w-full max-w-[1286px] flex-col gap-4 pt-4 md:gap-6 md:pt-6 lg:gap-8 lg:pt-8 xl:py-6">
          <div className="flex items-center gap-4 bg-blue/10 px-4 py-3">
            <button className="flex items-center justify-center rounded-lg p-2 hover:bg-white/20 transition-colors">
              <span className="iconify i-material-symbols:arrow-back text-2xl text-gray-950"></span>
            </button>
            <h1 className="flex-1 text-center text-xl font-bold text-gray-950 md:text-2xl">
              Jogo do Bicho Online
            </h1>
          </div>
          <PromotionalBanner />
          <div className="rounded-xl bg-white p-4 md:p-6 lg:p-8">
            <BetFlow />
          </div>
        </div>
      </main>
      <Footer />
      <BottomNav />
    </div>
  )
}
""",
    
    'app/cotacao/page.tsx': """import Header from '@/components/Header'
import Footer from '@/components/Footer'
import BottomNav from '@/components/BottomNav'
import QuotationGrid from '@/components/QuotationGrid'

export default function CotacaoPage() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-scale-100">
      <Header />
      <main className="relative flex flex-1 flex-col overflow-auto bg-gray-scale-100 text-[#1C1C1C]">
        <div className="mx-auto flex w-full max-w-[1286px] flex-col gap-4 pt-4 md:gap-6 md:pt-6 lg:gap-8 lg:pt-8 xl:py-6">
          <div className="flex items-center gap-4 bg-blue/10 px-4 py-3">
            <button className="flex items-center justify-center rounded-lg p-2 hover:bg-white/20 transition-colors">
              <span className="iconify i-material-symbols:arrow-back text-2xl text-gray-950"></span>
            </button>
            <h1 className="flex-1 text-center text-xl font-bold text-gray-950 md:text-2xl">
              Cotação
            </h1>
          </div>
          <div className="rounded-xl bg-white p-4 md:p-6 lg:p-8">
            <div className="mb-6 flex gap-4 border-b border-gray-200">
              <button className="border-b-2 border-blue pb-2 px-4 font-semibold text-blue">
                <span className="iconify i-fluent:animal-rabbit-20-regular mr-2"></span>
                Bicho
              </button>
              <button className="pb-2 px-4 font-semibold text-gray-600 hover:text-blue transition-colors">
                <span className="iconify i-fluent:ticket-diagonal-16-regular mr-2"></span>
                Loterias
              </button>
            </div>
            <QuotationGrid />
          </div>
        </div>
      </main>
      <Footer />
      <BottomNav />
    </div>
  )
}
""",
    
    'app/suporte/page.tsx': """'use client'

import Header from '@/components/Header'
import Footer from '@/components/Footer'
import BottomNav from '@/components/BottomNav'

export default function SuportePage() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-scale-100">
      <Header />
      <main className="relative flex flex-1 flex-col overflow-auto bg-gray-scale-100 text-[#1C1C1C]">
        <div className="mx-auto flex w-full max-w-[1286px] flex-col gap-4 pt-4 md:gap-6 md:pt-6 lg:gap-8 lg:pt-8 xl:py-6">
          <div className="flex items-center gap-4 bg-blue/10 px-4 py-3">
            <a href="/" className="flex items-center justify-center rounded-lg p-2 hover:bg-white/20 transition-colors">
              <span className="iconify i-material-symbols:arrow-back text-2xl text-gray-950"></span>
            </a>
            <h1 className="flex-1 text-center text-xl font-bold text-gray-950 md:text-2xl">
              Suporte
            </h1>
          </div>
          <div className="rounded-xl bg-white p-4 md:p-6 lg:p-8">
            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-bold text-blue">
                Aprenda a navegar pelo site da Poste no Bicho
              </h2>
              <p className="mb-6 text-gray-700">
                Explore nossos <strong>tutoriais</strong> e saiba como aproveitar o melhor da Poste no Bicho.
              </p>
              <button className="rounded-lg bg-blue px-6 py-3 font-semibold text-white hover:bg-blue-scale-70 transition-colors">
                Tour de boas-vindas
              </button>
            </section>
            <section className="mb-8">
              <h3 className="mb-4 text-xl font-bold text-gray-950">Entenda as funcionalidades</h3>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                <div>
                  <h4 className="mb-3 text-lg font-semibold text-gray-950">Funcionalidades</h4>
                  <ul className="space-y-2">
                    <li><a href="/suporte/saque" className="text-blue hover:underline">SAQUE</a></li>
                    <li><a href="/suporte/transacoes" className="text-blue hover:underline">MINHAS TRANSAÇÕES</a></li>
                    <li><a href="/jogo-do-bicho/resultados" className="text-blue hover:underline">RESULTADOS</a></li>
                    <li><a href="/jogo-do-bicho" className="text-blue hover:underline">APOSTAS</a></li>
                  </ul>
                </div>
                <div>
                  <h4 className="mb-3 text-lg font-semibold text-gray-950">Jogo do Bicho</h4>
                  <ul className="space-y-2">
                    <li><a href="/jogo-do-bicho?modalidade=grupos" className="text-blue hover:underline">GRUPOS</a></li>
                    <li><a href="/jogo-do-bicho?modalidade=dezenas" className="text-blue hover:underline">DEZENAS</a></li>
                    <li><a href="/jogo-do-bicho?modalidade=centenas" className="text-blue hover:underline">CENTENAS</a></li>
                    <li><a href="/jogo-do-bicho?modalidade=milhares" className="text-blue hover:underline">MILHARES</a></li>
                  </ul>
                </div>
                <div>
                  <h4 className="mb-3 text-lg font-semibold text-gray-950">Loterias</h4>
                  <ul className="space-y-2">
                    <li><a href="/jogo-do-bicho?modalidade=lotinha" className="text-blue hover:underline">LOTINHA</a></li>
                    <li><a href="/jogo-do-bicho?modalidade=quininha" className="text-blue hover:underline">QUININHA</a></li>
                    <li><a href="/jogo-do-bicho?modalidade=seninha" className="text-blue hover:underline">SENINHA</a></li>
                  </ul>
                </div>
              </div>
            </section>
            <section className="border-t border-gray-200 pt-8">
              <div className="flex flex-col items-center gap-4 text-center">
                <p className="text-gray-700">
                  Se precisar de ajuda, fale no WhatsApp: <strong>+55 (21) 9 6688-5185</strong>
                </p>
                <a
                  href="https://wa.me/5521966885185"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg bg-green-500 px-6 py-3 font-semibold text-white hover:bg-green-600 transition-colors"
                >
                  <span className="text-2xl">💬</span>
                  Falar no WhatsApp
                </a>
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
      <BottomNav />
    </div>
  )
}
"""
}

created = []
errors = []

for filepath, content in pages_content.items():
    try:
        dir_path = os.path.dirname(filepath)
        if dir_path:
            os.makedirs(dir_path, exist_ok=True)
        
        if os.path.exists(filepath):
            print(f"⚠️  {filepath} já existe, pulando...")
            continue
        
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
PYEOF

echo ""
echo "=== Verificando páginas criadas ==="
find app -name "page.tsx" -type f | sort

echo ""
echo "=== Rebuild ==="
rm -rf .next
npm run build 2>&1 | tail -40

if [ $? -eq 0 ]; then
  echo ""
  echo "=== ✅ Build OK! Reiniciando PM2 ==="
  pm2 restart lotbicho
  sleep 3
  echo ""
  echo "=== Testando rotas principais ==="
  for route in "/" "/login" "/cadastro" "/apostar" "/cotacao" "/suporte"; do
    echo -n "Testando $route: "
    curl -s -I http://localhost:3000$route | grep "HTTP" | head -1
  done
fi
