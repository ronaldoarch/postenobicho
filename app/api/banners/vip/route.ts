import { NextResponse } from 'next/server'
import { getVipBanner } from '@/lib/banners-store'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const banner = await getVipBanner()
    return NextResponse.json({ banner })
  } catch (error) {
    console.error('Erro ao buscar banner VIP:', error)
    return NextResponse.json({ banner: null }, { status: 500 })
  }
}
