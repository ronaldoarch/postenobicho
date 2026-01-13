import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { parseSessionToken } from '@/lib/auth'

const SAMPLE_BETS = [
  {
    id: 1,
    concurso: 'PT-RIO 9h20',
    loteria: 'PT Rio de Janeiro',
    estado: 'RJ',
    horario: '09:20',
    data: '2026-01-13',
    aposta: 'Milhar 4732',
    valor: 2.5,
    retorno: 60,
    status: 'pendente',
  },
  {
    id: 2,
    concurso: 'PT-RIO 11h20',
    loteria: 'PT Rio de Janeiro',
    estado: 'RJ',
    horario: '11:20',
    data: '2026-01-13',
    aposta: 'Grupo 08',
    valor: 1.5,
    retorno: 12,
    status: 'ganhou',
  },
  {
    id: 3,
    concurso: 'PT-SP 10h',
    loteria: 'PT-SP/Bandeirantes',
    estado: 'SP',
    horario: '10:00',
    data: '2026-01-13',
    aposta: 'Duque 24-18',
    valor: 3,
    retorno: 0,
    status: 'perdeu',
  },
]

export async function GET() {
  const session = cookies().get('lotbicho_session')?.value
  const user = parseSessionToken(session)

  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  return NextResponse.json({
    user: { id: user.id, email: user.email, nome: user.nome },
    apostas: SAMPLE_BETS,
    total: SAMPLE_BETS.length,
  })
}
