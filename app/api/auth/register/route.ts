import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSessionToken, hashPassword, cleanCPF, isValidCPFFormat } from '@/lib/auth'
import { MetaTrackingServer } from '@/lib/meta-tracking-server'
import { WebhookTracker } from '@/lib/webhook-tracker'
import { getClientIP, geolocateIP, salvarLocalizacaoUsuario } from '@/lib/ip-geolocation'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { nome, email, password, telefone, cpf } = body || {}

    if (!nome || !email || !password) {
      return NextResponse.json({ error: 'Nome, email e senha são obrigatórios' }, { status: 400 })
    }

    // CPF é obrigatório
    if (!cpf) {
      return NextResponse.json({ error: 'CPF é obrigatório' }, { status: 400 })
    }

    // Validar formato do CPF
    if (!isValidCPFFormat(cpf)) {
      return NextResponse.json({ error: 'CPF inválido. Digite um CPF válido com 11 dígitos.' }, { status: 400 })
    }

    const cpfLimpo = cleanCPF(cpf)

    // Verificar se email já existe
    const existingEmail = await prisma.usuario.findUnique({ where: { email } })
    if (existingEmail) {
      return NextResponse.json({ error: 'Email já cadastrado' }, { status: 409 })
    }

    // Verificar se CPF já existe (uma conta por CPF)
    const existingCPF = await prisma.usuario.findUnique({ where: { cpf: cpfLimpo } })
    if (existingCPF) {
      return NextResponse.json({ error: 'CPF já cadastrado. Apenas uma conta por CPF é permitida.' }, { status: 409 })
    }

    const passwordHash = hashPassword(password)

    const user = await prisma.usuario.create({
      data: {
        nome,
        email,
        cpf: cpfLimpo,
        telefone: telefone || null,
        passwordHash,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        nome: true,
        email: true,
        telefone: true,
        saldo: true,
        bonus: true,
        bonusBloqueado: true,
        bonusSemanal: true,
      },
    })

    const token = createSessionToken({ id: user.id, email: user.email, nome: user.nome })
    
    // Capturar IP e geolocalizar (não bloquear o fluxo se falhar)
    const clientIP = getClientIP(req)
    console.log(`🔍 Capturando IP para cadastro do usuário ${user.id}:`, clientIP)
    if (clientIP) {
      geolocateIP(clientIP)
        .then(geoData => {
          if (geoData) {
            console.log(`✅ Geolocalização bem-sucedida para IP ${clientIP}:`, geoData.cidade, geoData.estado, geoData.pais)
            return salvarLocalizacaoUsuario(user.id, clientIP, 'cadastro', geoData)
          } else {
            console.warn(`⚠️ Geolocalização retornou null para IP ${clientIP}`)
          }
        })
        .catch(err => {
          console.error('❌ Erro ao geolocalizar IP no cadastro:', err)
        })
    } else {
      console.warn(`⚠️ Não foi possível capturar IP para cadastro do usuário ${user.id}`)
    }
    
    // Rastrear cadastro no Meta Pixel (Conversions API)
    MetaTrackingServer.trackRegistration(user.id).catch(err => {
      console.error('Erro ao rastrear cadastro no Meta Pixel:', err)
    })
    
    // Enviar webhook de cadastro
    WebhookTracker.cadastro(user.id, {
      nome: user.nome,
      email: user.email,
      telefone: user.telefone,
    }).catch(err => {
      console.error('Erro ao enviar webhook de cadastro:', err)
    })
    
    const res = NextResponse.json({ user, message: 'Cadastro realizado com sucesso' })
    res.cookies.set('lotbicho_session', token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 dias
    })
    return res
  } catch (error) {
    console.error('Erro ao cadastrar:', error)
    return NextResponse.json({ error: 'Erro ao cadastrar' }, { status: 500 })
  }
}
