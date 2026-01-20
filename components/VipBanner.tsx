'use client'

import { useEffect, useState } from 'react'

interface BannerItem {
  id: number
  bannerImage?: string | null
  title?: string | null
  active?: boolean
}

export default function VipBanner() {
  const [banner, setBanner] = useState<BannerItem | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/banners/vip?t=${Date.now()}`, { cache: 'no-store' })
        const data = await res.json()
        if (data?.banner) {
          setBanner(data.banner)
        } else {
          setBanner(null)
        }
      } catch (e) {
        console.error('Erro ao carregar banner VIP:', e)
        setBanner(null)
      }
    }
    load()
  }, [])

  if (!banner?.bannerImage) return null

  return (
    <section className="w-full overflow-hidden rounded-lg">
      <a href="/grupos" className="block">
        <img
          src={banner.bannerImage}
          alt={banner.title || 'Banner VIP'}
          className="w-full"
        />
      </a>
    </section>
  )
}
