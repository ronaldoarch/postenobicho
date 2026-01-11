'use client'

export default function VipBanner() {
  return (
    <section className="w-full overflow-hidden rounded-lg">
      <a href="/grupos" className="block">
        <img
          src="https://ponto-do-bicho.b-cdn.net/inicio/Grupo VIP Menor.webp"
          alt="Banner Grupo VIP"
          className="hidden aspect-[579/148] w-full md:block"
        />
        <img
          src="https://ponto-do-bicho.b-cdn.net/inicio/Grupo Vip Menor Mobile.webp"
          alt="Banner Grupo VIP"
          className="aspect-[375/154] w-full md:hidden"
        />
      </a>
    </section>
  )
}
