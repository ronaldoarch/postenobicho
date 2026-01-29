'use client'

import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useConfiguracoes } from '@/hooks/useConfiguracoes'
import Image from 'next/image'
import { useEffect, useState } from 'react'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { configuracoes } = useConfiguracoes()
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const [redirected, setRedirected] = useState(false)

  // Verificar autenticação (exceto na página de login)
  useEffect(() => {
    if (pathname === '/admin/login') {
      setLoading(false)
      setIsAuthenticated(true) // Permite acesso à página de login
      return
    }

    // Evitar loops de redirecionamento
    if (redirected) {
      return
    }

    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' })
        const data = await res.json()
        if (data.user) {
          // Verificar se o usuário é admin
          if (!data.user.admin) {
            setIsAuthenticated(false)
            setRedirected(true)
            // Redirecionar para home do site (não admin/login para evitar loop)
            window.location.href = '/'
            return
          }
          setIsAuthenticated(true)
        } else {
          setIsAuthenticated(false)
          setRedirected(true)
          // Se não autenticado, redirecionar para login do admin
          router.push('/admin/login')
        }
      } catch (error) {
        setIsAuthenticated(false)
        setRedirected(true)
        // Em caso de erro, redirecionar para home
        window.location.href = '/'
      } finally {
        setLoading(false)
      }
    }
    checkAuth()
  }, [pathname, router, redirected])

  // Se estiver na página de login, não mostrar o layout admin
  if (pathname === '/admin/login') {
    return <>{children}</>
  }

  // Mostrar loading enquanto verifica autenticação
  if (loading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="mb-4 text-4xl">🦁</div>
          <div className="text-gray-600">Verificando autenticação...</div>
        </div>
      </div>
    )
  }

  const menuItems = [
    { href: '/admin', label: 'Dashboard', icon: '📊' },
    { href: '/admin/banners', label: 'Banners', icon: '🖼️' },
    { href: '/admin/stories', label: 'Stories', icon: '📱' },
    { href: '/admin/cotacoes', label: 'Cotações', icon: '💰' },
    { href: '/admin/cotacoes-especiais', label: 'Milhares/Centenas Cotadas', icon: '🎯' },
    { href: '/admin/extracoes', label: 'Extrações', icon: '🎲' },
    { href: '/admin/modalidades', label: 'Modalidades', icon: '🎯' },
    { href: '/admin/descarga', label: 'Descarga', icon: '⚠️' },
    { href: '/admin/liquidacao', label: 'Liquidação', icon: '💵' },
    { href: '/admin/usuarios', label: 'Usuários', icon: '👥' },
    { href: '/admin/localizacoes', label: 'Localizações', icon: '🗺️' },
    { href: '/admin/saques', label: 'Saques', icon: '💳' },
    { href: '/admin/pagamentos-pix', label: 'Pagamentos PIX', icon: '💸' },
    { href: '/admin/promocoes', label: 'Promoções', icon: '🎁' },
    { href: '/admin/gateways', label: 'Gateways', icon: '🔌' },
    { href: '/admin/temas', label: 'Temas', icon: '🎨' },
    { href: '/admin/integracoes', label: 'Integrações', icon: '🔗' },
    { href: '/admin/configuracoes', label: 'Configurações', icon: '⚙️' },
  ]

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="relative w-64 bg-blue text-white shadow-lg flex flex-col">
        <div className="p-6 border-b border-blue-700">
          <div className="flex items-center gap-2 mb-2">
            {configuracoes.logoSite ? (
              <Image
                src={configuracoes.logoSite}
                alt={configuracoes.nomePlataforma}
                width={40}
                height={40}
                className="object-contain"
              />
            ) : (
              <span className="text-3xl">🦁</span>
            )}
            <h1 className="text-2xl font-bold">{configuracoes.nomePlataforma}</h1>
          </div>
          <p className="text-sm text-blue-200 mt-1">Painel Administrativo</p>
        </div>
        <nav className="p-4 flex-1">
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    pathname === item.href
                      ? 'bg-white text-blue font-semibold'
                      : 'hover:bg-blue-700 text-white'
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="p-4 border-t border-blue-700 space-y-2">
          <button
            onClick={async () => {
              await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
              router.push('/admin/login')
            }}
            className="flex w-full items-center gap-3 px-4 py-3 rounded-lg hover:bg-blue-700 text-white transition-colors"
          >
            <span>🚪</span>
            <span>Sair</span>
          </button>
          <Link
            href="/"
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-blue-700 text-white transition-colors"
          >
            <span>←</span>
            <span>Voltar ao Site</span>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-gray-100">
        <div className="px-8 pb-8 pt-2">
          {children}
        </div>
      </main>
    </div>
  )
}
