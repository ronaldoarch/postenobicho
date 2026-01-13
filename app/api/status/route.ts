import { NextResponse } from 'next/server'

const RAW_SOURCE =
  process.env.BICHO_CERTO_API ?? 'https://okgkgswwkk8ows0csow0c4gg.agenciamidas.com/api/resultados'
const SOURCE_ROOT = RAW_SOURCE.replace(/\/api\/resultados$/, '')

export async function GET() {
  try {
    const res = await fetch(`${SOURCE_ROOT}/api/status`, { cache: 'no-store' })
    if (!res.ok) throw new Error(`Upstream status ${res.status}`)
    const data = await res.json()
    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.error('Erro ao consultar status do monitor:', error)
    return NextResponse.json(
      {
        monitor_rodando: false,
        error: 'Falha ao consultar status do monitor',
      },
      { status: 502 }
    )
  }
}
