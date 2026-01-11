'use client'

export default function PromotionalBanner() {
  return (
    <div className="relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-500 p-6 md:p-8 lg:p-12">
      {/* Background Pattern */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px)',
        }}
      />
      
      {/* Content */}
      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Left Side - Text */}
        <div className="flex-1 text-center md:text-left">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-blue-950 leading-tight">
            Gaste pouco hoje para multiplicar seu futuro amanhã
          </h2>
        </div>
        
        {/* Right Side - Animal Illustrations */}
        <div className="flex shrink-0 items-center justify-center gap-4 md:gap-6">
          {/* Placeholder para ilustrações de animais */}
          <div className="flex items-center gap-2">
            <div className="text-6xl md:text-7xl">🐷</div>
            <div className="text-6xl md:text-7xl">🐯</div>
            <div className="text-6xl md:text-7xl">🐵</div>
          </div>
          
          {/* Moedas e elementos decorativos */}
          <div className="flex flex-col items-center gap-2">
            <div className="text-4xl">🪙</div>
            <div className="text-3xl">🍀</div>
          </div>
        </div>
      </div>
    </div>
  )
}
