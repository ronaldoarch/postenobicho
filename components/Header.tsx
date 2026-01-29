'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useConfiguracoes } from '@/hooks/useConfiguracoes'
import ProfileModal from './ProfileModal'

export default function Header() {
  const { configuracoes } = useConfiguracoes()
  const pathname = usePathname()
  const router = useRouter()
  const [profileModalOpen, setProfileModalOpen] = useState(false)
  const [scrollY, setScrollY] = useState(0)
  
  // Logo só é clicável na home
  const isHome = pathname === '/'
  const [user, setUser] = useState<{
    id: number
    nome: string
    email: string
    telefone: string | null
    saldo: number
    bonus: number
    bonusBloqueado: number
    bonusSemanal: number
  } | null>(null)
  const [loadingUser, setLoadingUser] = useState(true)
  
  // Detectar scroll para esconder logo no mobile
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY)
    }
    
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const loadUser = async () => {
    try {
      setLoadingUser(true)
      const res = await fetch('/api/auth/me', { cache: 'no-store' })
      if (!res.ok) {
        setUser(null)
        return
      }
      const data = await res.json()
      setUser(data.user || null)
    } catch (e) {
      setUser(null)
    } finally {
      setLoadingUser(false)
    }
  }

  useEffect(() => {
    loadUser()
    
    // Atualizar saldo automaticamente a cada 5 segundos
    const interval = setInterval(() => {
      loadUser()
    }, 5000)
    
    // Escutar eventos de atualização de saldo (disparados após apostas/ganhos)
    const handleSaldoUpdate = () => {
      loadUser()
    }
    
    window.addEventListener('saldo-updated', handleSaldoUpdate)
    
    return () => {
      clearInterval(interval)
      window.removeEventListener('saldo-updated', handleSaldoUpdate)
    }
  }, [])

  return (
    <header className="fixed top-0 left-0 right-0 z-[100] flex w-full items-center justify-between bg-blue px-4 py-3 text-white shadow-lg lg:px-8" style={{ height: '70px', overflow: 'visible' }}>
      {/* Logo posicionado como adesivo 3D - APENAS NA HOME */}
      {/* Mobile: canto direito, desaparece ao fazer scroll */}
      {/* Desktop: canto esquerdo, fixa */}
      {isHome && (
        <div 
          className={`fixed right-4 lg:absolute lg:left-8 transition-opacity duration-300 ${
            scrollY > 50 ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
          style={{ 
            top: '50px', 
            zIndex: scrollY > 50 ? -1 : 60, // Fica para trás quando scroll > 50px
            pointerEvents: scrollY > 50 ? 'none' : 'auto',
            position: 'fixed' // Fixa no mobile, absolute no desktop (via lg:absolute)
          }}
        >
          <a href="/" className="flex items-center gap-2 relative block">
            <div className="flex items-center gap-2 relative">
              {configuracoes.logoSite ? (
                <img
                  src={configuracoes.logoSite}
                  alt={configuracoes.nomePlataforma}
                  className="relative h-40 w-auto lg:h-52 transition-all duration-300 hover:scale-110"
                  style={{
                    filter: 'drop-shadow(0 12px 24px rgba(0, 0, 0, 0.7)) drop-shadow(0 6px 12px rgba(0, 0, 0, 0.5)) drop-shadow(0 0 15px rgba(0, 0, 0, 0.3))',
                    zIndex: 60,
                    display: 'block',
                  }}
                  onError={(e) => {
                    console.error('Erro ao carregar logo:', e);
                  }}
                />
              ) : (
                <>
                  <span 
                    className="text-7xl lg:text-9xl relative transition-all duration-300 hover:scale-110 block"
                    style={{
                      filter: 'drop-shadow(0 12px 24px rgba(0, 0, 0, 0.7)) drop-shadow(0 6px 12px rgba(0, 0, 0, 0.5)) drop-shadow(0 0 15px rgba(0, 0, 0, 0.3))',
                      zIndex: 60,
                      lineHeight: '1',
                    }}
                  >
                    🦁
                  </span>
                  <span 
                    className="text-xl font-bold text-white lg:text-2xl relative transition-all duration-300 block"
                    style={{
                      filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.4))',
                      zIndex: 60,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {configuracoes.nomePlataforma}
                  </span>
                </>
              )}
            </div>
          </a>
        </div>
      )}

      {/* Navegação centralizada */}
      <nav className="hidden lg:flex flex-1 justify-center">
        <ul className="flex items-center gap-2">
          <li>
            <a 
              href="/" 
              onClick={(e) => {
                e.preventDefault()
                window.location.href = '/'
              }}
              className="h-12 rounded-2xl px-4 py-2 hover:bg-blue-scale-70 transition-colors"
            >
              Início
            </a>
          </li>
          <li>
            <a href="/jogo-do-bicho" className="h-12 rounded-2xl px-4 py-2 hover:bg-blue-scale-70 transition-colors">
              Apostar
            </a>
          </li>
          <li>
            <a href="/jogo-do-bicho/resultados" className="h-12 rounded-2xl px-4 py-2 hover:bg-blue-scale-70 transition-colors">
              Resultados
            </a>
          </li>
          <li>
            <a href="/minhas-apostas" className="h-12 rounded-2xl px-4 py-2 hover:bg-blue-scale-70 transition-colors">
              Minhas apostas
            </a>
          </li>
          <li>
            <a href="/jogo-do-bicho/cotacao" className="h-12 rounded-2xl px-4 py-2 hover:bg-blue-scale-70 transition-colors">
              Cotação
            </a>
          </li>
          <li>
            <a href="/suporte" className="h-12 rounded-2xl px-4 py-2 hover:bg-blue-scale-70 transition-colors flex items-center gap-1">
              <span className="iconify i-fluent:question-circle-16-regular" style={{ fontSize: '18px' }}></span>
              Suporte
            </a>
          </li>
        </ul>
      </nav>

      {/* Botões à direita */}
      <div className="flex items-center gap-2 lg:px-2" style={{ zIndex: 50 }}>
        {/* Botão Suporte - visível em mobile e desktop */}
        <a 
          href="/suporte" 
          className="flex items-center gap-1 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm font-semibold text-white hover:bg-white/20 transition-colors"
          title="Suporte"
        >
          <span className="iconify i-fluent:question-circle-16-regular" style={{ fontSize: '18px' }}></span>
          <span className="hidden sm:inline">Suporte</span>
        </a>
        <div className="relative cursor-pointer flex items-center">
          <span className="iconify i-fluent:alert-16-regular text-2xl text-white opacity-50"></span>
        </div>
        {user ? (
          <button
            onClick={() => setProfileModalOpen(true)}
            className="flex cursor-pointer items-center gap-0.5 rounded-xl border border-white/20 bg-transparent px-3 py-2 text-white lg:gap-2 hover:bg-white/10 transition-colors"
          >
            <span className="iconify i-material-symbols:person-outline-rounded" style={{ fontSize: '20px' }}></span>
            <span className="flex items-center gap-1 text-xs lg:text-sm">
              <span className="font-semibold">R$ {user.saldo.toFixed(2)}</span>
            </span>
            <span className="iconify i-mdi:chevron-down"></span>
          </button>
        ) : (
          !loadingUser && (
            <div className="flex items-center gap-2">
              <a
                href="/login"
                className="rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm font-semibold text-white hover:bg-white/20 transition-colors"
              >
                Entrar
              </a>
              <a
                href="/cadastro"
                className="rounded-xl bg-yellow px-3 py-2 text-sm font-bold text-blue-950 hover:bg-yellow/90 transition-colors"
              >
                Cadastrar
              </a>
            </div>
          )
        )}
      </div>

      {/* Profile Modal */}
      <ProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        user={user}
        onLogout={async () => {
          try {
            console.log('🔓 Iniciando logout...')
            
            // Limpar estado local primeiro
            setUser(null)
            setProfileModalOpen(false)
            
            // Tentar chamar API de logout
            try {
              const response = await fetch('/api/auth/logout', { 
                method: 'POST',
                credentials: 'include',
                cache: 'no-store',
              })
              console.log('✅ Resposta do logout:', response.status)
            } catch (apiError) {
              console.error('⚠️ Erro na API de logout (continuando mesmo assim):', apiError)
            }
            
            // Limpar cookies manualmente de todas as formas possíveis
            const domain = window.location.hostname
            const cookiesToClear = [
              `lotbicho_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`,
              `lotbicho_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`,
              `lotbicho_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax; Secure`,
              `lotbicho_session=; path=/; domain=${domain}; expires=Thu, 01 Jan 1970 00:00:00 GMT`,
              `lotbicho_session=; path=/; domain=.${domain}; expires=Thu, 01 Jan 1970 00:00:00 GMT`,
            ]
            
            cookiesToClear.forEach(cookie => {
              document.cookie = cookie
            })
            
            console.log('✅ Cookies limpos manualmente')
            
            // Redirecionar com parâmetro de logout para forçar limpeza
            window.location.href = '/?logout=success&t=' + Date.now()
          } catch (error) {
            console.error('❌ Erro ao fazer logout:', error)
            // Mesmo com erro, limpar tudo e redirecionar
            setUser(null)
            setProfileModalOpen(false)
            document.cookie = 'lotbicho_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
            window.location.href = '/?logout=force&t=' + Date.now()
          }
        }}
      />
    </header>
  )
}
