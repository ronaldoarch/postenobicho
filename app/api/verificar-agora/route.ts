import { NextRequest, NextResponse } from 'next/server'

const RAW_SOURCE =
  process.env.BICHO_CERTO_API ?? 'https://okgkgswwkk8ows0csow0c4gg.agenciamidas.com/api/resultados'
const SOURCE_ROOT = RAW_SOURCE.replace(/\/api\/resultados$/, '')

export async function POST(_req: NextRequest) {
  try {
    const res = await fetch(`${SOURCE_ROOT}/api/verificar-agora`, {
      method: 'POST',
      cache: 'no-store',
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(`Upstream status ${res.status}`)
    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.error('Erro ao acionar verificar-agora no monitor:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Falha ao acionar verificação imediata',
      },
      { status: 502 }
    )
  }
}
