import { NextResponse } from 'next/server'
import { getConfiguracoes } from '@/lib/configuracoes-store'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const configuracoes = await getConfiguracoes()
    return NextResponse.json({ configuracoes })
  } catch (error) {
    console.error('Erro ao buscar configurações:', error)
    // Retornar configuração padrão em caso de erro ao invés de 500
    return NextResponse.json({
      configuracoes: {
        nomePlataforma: 'Poste no Bicho',
        numeroSuporte: '(00) 00000-0000',
        emailSuporte: 'suporte@postenobicho.com',
        whatsappSuporte: '5500000000000',
        logoSite: '',
        liquidacaoAutomatica: true,
      },
    })
  }
}
