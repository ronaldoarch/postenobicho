import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { parseSessionToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getConfiguracoes, updateConfiguracoes } from '@/lib/configuracoes-store'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const configuracoes = await getConfiguracoes()
    return NextResponse.json({ configuracoes })
  } catch (error) {
    console.error('Erro ao buscar configurações:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar configurações', details: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Verificar autenticação
    const sessionCookie = cookies().get('lotbicho_session')?.value || cookies().get('postenobicho_session')?.value
    
    if (!sessionCookie) {
      console.log('❌ Nenhum cookie de sessão encontrado')
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const user = parseSessionToken(sessionCookie)

    if (!user) {
      console.log('❌ Token de sessão inválido')
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    console.log('✅ Usuário autenticado:', { id: user.id, email: user.email })

    // Verificar se usuário é admin
    const usuario = await prisma.usuario.findUnique({
      where: { id: user.id },
      select: { 
        id: true,
        email: true,
        admin: true,
      },
    })

    if (!usuario) {
      console.log('❌ Usuário não encontrado no banco:', user.id)
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    console.log('👤 Usuário encontrado:', { id: usuario.id, email: usuario.email, admin: usuario.admin })

    if (!usuario.admin) {
      console.log('❌ Usuário não é admin:', usuario.email)
      return NextResponse.json({ 
        error: 'Acesso negado. Apenas administradores podem alterar configurações.',
        details: `Usuário ${usuario.email} não possui permissões de administrador.`
      }, { status: 403 })
    }

    const body = await request.json()
    console.log('💾 Salvando configurações...')
    const configuracoes = await updateConfiguracoes(body)
    
    console.log('✅ Configurações salvas com sucesso')
    return NextResponse.json({ 
      configuracoes, 
      message: 'Configurações atualizadas com sucesso' 
    })
  } catch (error) {
    console.error('❌ Erro ao atualizar configurações:', error)
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    const errorStack = error instanceof Error ? error.stack : undefined
    
    return NextResponse.json({ 
      error: 'Erro ao atualizar configurações',
      details: errorMessage,
      ...(process.env.NODE_ENV === 'development' && { stack: errorStack })
    }, { status: 500 })
  }
}
