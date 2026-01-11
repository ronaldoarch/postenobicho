'use client'

export default function Header() {
  return (
    <header className="sticky top-0 z-30 flex w-full items-center justify-between bg-blue px-4 py-3 text-white lg:px-8">
      <div className="flex items-center gap-4">
        <a href="/" className="flex items-center gap-2">
          <img 
            src="https://ponto-do-bicho.b-cdn.net/logos/logo_branca.webp" 
            alt="Logo" 
            className="h-8 w-auto lg:h-10"
          />
        </a>
      </div>

      <nav className="hidden lg:flex">
        <ul className="flex items-center gap-2">
          <li>
            <a href="/" className="h-12 rounded-2xl px-4 py-2 hover:bg-blue-scale-70 transition-colors">
              Início
            </a>
          </li>
          <li>
            <a href="/apostar" className="h-12 rounded-2xl px-4 py-2 hover:bg-blue-scale-70 transition-colors">
              Apostar
            </a>
          </li>
          <li>
            <a href="/resultados" className="h-12 rounded-2xl px-4 py-2 hover:bg-blue-scale-70 transition-colors">
              Resultados
            </a>
          </li>
          <li>
            <a href="/minhas-apostas" className="h-12 rounded-2xl px-4 py-2 hover:bg-blue-scale-70 transition-colors">
              Minhas apostas
            </a>
          </li>
          <li>
            <a href="/cotacao" className="h-12 rounded-2xl px-4 py-2 hover:bg-blue-scale-70 transition-colors">
              Cotação
            </a>
          </li>
        </ul>
      </nav>

      <div className="flex items-center gap-2 lg:px-2">
        <div className="relative cursor-pointer flex items-center">
          <span className="iconify i-fluent:alert-16-regular text-2xl text-white opacity-50"></span>
        </div>
        <div className="inline-block text-left lg:relative">
          <button className="flex cursor-pointer items-center gap-0.5 rounded-xl border border-white/20 bg-transparent px-3 py-2 text-white lg:gap-2 hover:bg-white/10 transition-colors">
            <span className="iconify i-material-symbols:person-outline-rounded" style={{ fontSize: '20px' }}></span>
            <span className="flex items-center gap-1 text-xs lg:text-sm">
              <div className="h-4 w-16 animate-pulse rounded bg-white/30 lg:w-20"></div>
            </span>
            <span className="iconify i-mdi:chevron-down"></span>
          </button>
        </div>
      </div>
    </header>
  )
}
