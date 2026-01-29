# 📚 Guia Completo de Implementação: Descarga, Validação Admin e CPF

Este guia detalha como implementar três funcionalidades essenciais em um sistema de apostas: **Sistema de Descarga (Limites de Apostas)**, **Validação de Administrador** e **Validação de CPF Único**.

---

## 📋 Índice

1. [Sistema de Descarga](#1-sistema-de-descarga)
2. [Validação de Administrador](#2-validação-de-administrador)
3. [Validação de CPF Único](#3-validação-de-cpf-único)
4. [Integração Completa](#4-integração-completa)

---

## 1. Sistema de Descarga

O sistema de descarga controla os limites de apostas por modalidade, prêmio e número específico, prevenindo que a banca seja exposta a riscos excessivos.

### 1.1. Schema do Banco de Dados

Primeiro, crie as tabelas necessárias no seu banco de dados:

```prisma
// Prisma Schema
model LimiteDescarga {
  id         Int      @id @default(autoincrement())
  modalidade String   // Nome da modalidade (ex: "Milhar", "Centena")
  premio     Int      // 1 ao 5 (prêmio)
  limite     Float    // Limite em R$ por número específico
  ativo      Boolean  @default(true)
  loteria    String   @default("") // Loteria/extracao - "" para limite geral
  horario    String   @default("") // Horário da extração - "" para limite geral
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@unique([modalidade, premio, loteria, horario])
  @@index([modalidade])
  @@index([loteria, horario, premio])
}

model NumeroBloqueado {
  id         Int      @id @default(autoincrement())
  modalidade String   // Nome da modalidade
  premio     Int      // 1 ao 5 (prêmio)
  numero     String   // Número bloqueado (milhar/centena/dezena)
  loteria    String   // Loteria/extracao
  horario    String   // Horário da extração
  valorAtual Float    // Valor total apostado neste número
  limite     Float    // Limite que foi atingido
  bloqueadoEm DateTime @default(now())
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@unique([modalidade, premio, numero, loteria, horario])
  @@index([modalidade, premio, loteria, horario])
  @@index([numero])
}

model AlertaDescarga {
  id         Int      @id @default(autoincrement())
  modalidade String
  premio     Int
  valorAtual Float    // Valor total apostado
  limite     Float    // Limite configurado
  excedente  Float    // Valor que excedeu o limite
  resolvido  Boolean  @default(false)
  loteria    String?  // Loteria/extracao - null para alerta geral
  horario    String?  // Horário da extração - null para alerta geral
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}
```

### 1.2. Biblioteca de Descarga (`lib/descarga.ts`)

Crie uma biblioteca com as funções principais:

```typescript
import { prisma } from './prisma'

/**
 * Interface para definir limite de descarga
 */
export interface LimiteDescargaInput {
  modalidade: string
  premio: number // 1 ao 5
  limite: number
  loteria?: string // Opcional ("" = limite geral)
  horario?: string // Opcional (sempre "" no nosso caso)
}

/**
 * Define ou atualiza um limite de descarga
 */
export async function definirLimiteDescarga(input: LimiteDescargaInput) {
  if (input.premio < 1 || input.premio > 5) {
    throw new Error('Prêmio deve estar entre 1 e 5')
  }

  return await prisma.limiteDescarga.upsert({
    where: {
      modalidade_premio_loteria_horario: {
        modalidade: input.modalidade,
        premio: input.premio,
        loteria: input.loteria || '',
        horario: input.horario || '',
      },
    },
    update: {
      limite: input.limite,
      ativo: true,
    },
    create: {
      modalidade: input.modalidade,
      premio: input.premio,
      limite: input.limite,
      loteria: input.loteria || '',
      horario: input.horario || '',
      ativo: true,
    },
  })
}

/**
 * Verifica se um número específico já está bloqueado
 */
export async function verificarNumeroBloqueado(
  modalidade: string,
  premio: number,
  numero: string,
  loteria: string | null,
  horario: string | null
): Promise<{ bloqueado: boolean; dados?: any }> {
  const bloqueado = await prisma.numeroBloqueado.findUnique({
    where: {
      modalidade_premio_numero_loteria_horario: {
        modalidade,
        premio,
        numero,
        loteria: loteria || '',
        horario: horario || '',
      },
    },
  })

  return {
    bloqueado: !!bloqueado,
    dados: bloqueado || undefined,
  }
}

/**
 * Bloqueia automaticamente um número quando atinge o limite
 */
export async function bloquearNumero(
  modalidade: string,
  premio: number,
  numero: string,
  loteria: string | null,
  horario: string | null,
  valorAtual: number,
  limite: number
): Promise<void> {
  await prisma.numeroBloqueado.upsert({
    where: {
      modalidade_premio_numero_loteria_horario: {
        modalidade,
        premio,
        numero,
        loteria: loteria || '',
        horario: horario || '',
      },
    },
    update: {
      valorAtual,
      limite,
    },
    create: {
      modalidade,
      premio,
      numero,
      loteria: loteria || '',
      horario: horario || '',
      valorAtual,
      limite,
    },
  })
}

/**
 * Calcula o total apostado por número específico + extração + prêmio
 */
export async function calcularTotalApostadoPorNumeroExtracaoPremio(
  modalidade: string,
  premio: number,
  numero: string | null,
  loteria: string | null,
  horario: string | null
): Promise<number> {
  // Buscar todas as apostas pendentes da modalidade
  const apostas = await prisma.aposta.findMany({
    where: {
      modalidade,
      status: 'pendente',
      loteria: loteria || undefined,
      horario: horario || undefined,
    },
    select: {
      valor: true,
      detalhes: true,
      loteria: true,
      horario: true,
    },
  })

  let total = 0

  for (const aposta of apostas) {
    // Verificar se loteria e horário correspondem
    if (loteria && aposta.loteria !== loteria) continue
    if (horario && aposta.horario !== horario) continue

    const detalhes = aposta.detalhes as any
    if (!detalhes?.betData) continue

    const betData = detalhes.betData

    // Verificar se é modalidade numérica e se o número corresponde
    if (numero && betData.numberBets && betData.numberBets.length > 0) {
      // Normalizar número apostado (remover formatação)
      const numeroLimpo = numero.replace(/\D/g, '')
      const numeroApostadoLimpo = betData.numberBets[0]?.replace(/\D/g, '') || ''
      
      // Verificar se corresponde (pode ser milhar, centena ou dezena)
      let corresponde = false
      
      if (numeroLimpo.length === 4 && numeroApostadoLimpo.length === 4) {
        // Milhar: comparação exata
        corresponde = numeroLimpo === numeroApostadoLimpo
      } else if (numeroLimpo.length === 3 && numeroApostadoLimpo.length >= 3) {
        // Centena: últimos 3 dígitos
        corresponde = numeroLimpo === numeroApostadoLimpo.slice(-3)
      } else if (numeroLimpo.length === 2 && numeroApostadoLimpo.length >= 2) {
        // Dezena: últimos 2 dígitos
        corresponde = numeroLimpo === numeroApostadoLimpo.slice(-2)
      }
      
      if (!corresponde) continue
    } else if (numero) {
      // Se há número especificado mas a aposta não tem numberBets, não conta
      continue
    }

    // Verificar se a posição inclui o prêmio solicitado
    const positionToUse = betData.customPosition && betData.customPositionValue 
      ? betData.customPositionValue.trim() 
      : betData.position

    if (!positionToUse) continue

    let incluiPremio = false
    const cleanedPos = positionToUse.replace(/º/g, '').replace(/\s/g, '')

    if (cleanedPos === '1st' || cleanedPos === '1') {
      incluiPremio = premio === 1
    } else if (cleanedPos.includes('-')) {
      const [from, to] = cleanedPos.split('-').map(Number)
      if (!isNaN(from) && !isNaN(to)) {
        incluiPremio = premio >= from && premio <= to
      }
    } else {
      const singlePos = parseInt(cleanedPos, 10)
      if (!isNaN(singlePos) && singlePos >= 1 && singlePos <= 7) {
        incluiPremio = premio === singlePos
      }
    }

    if (incluiPremio) {
      total += aposta.valor
    }
  }

  return total
}

/**
 * Verifica se uma aposta excede o limite e bloqueia automaticamente o número se necessário
 */
export async function verificarLimiteDescargaPorNumero(
  modalidade: string,
  premio: number,
  numero: string, // Número apostado (milhar/centena/dezena)
  loteria: string | null, // Loteria/extracao
  horario: string | null, // Horário da extração
  valorAposta: number
): Promise<{ bloqueado: boolean; mensagem?: string; limite?: number; valorAtual?: number }> {
  // 1. Verificar se o número já está bloqueado
  const verificacaoBloqueio = await verificarNumeroBloqueado(modalidade, premio, numero, loteria, horario)
  if (verificacaoBloqueio.bloqueado && verificacaoBloqueio.dados) {
    const bloqueado = verificacaoBloqueio.dados
    const tipoNumero = numero.length === 4 ? 'milhar' : numero.length === 3 ? 'centena' : numero.length === 2 ? 'dezena' : 'número'
    const extracaoInfo = loteria || 'extração'
    const mensagem = `O ${tipoNumero} ${numero} no ${premio}º prêmio da ${extracaoInfo} está bloqueado. Limite atingido: R$ ${bloqueado.limite.toFixed(2)}.`
    
    return {
      bloqueado: true,
      mensagem,
      limite: bloqueado.limite,
      valorAtual: bloqueado.valorAtual,
    }
  }

  // 2. Buscar limite configurado para esta modalidade + prêmio + extração
  // Primeiro tenta buscar limite específico (com loteria), depois geral (sem loteria)
  let limiteConfig = await prisma.limiteDescarga.findFirst({
    where: {
      modalidade,
      premio,
      loteria: loteria || '',
      horario: '', // Sempre vazio, não usamos horário específico
      ativo: true,
    },
  })

  // Se não encontrou limite específico, busca limite geral
  if (!limiteConfig) {
    limiteConfig = await prisma.limiteDescarga.findFirst({
      where: {
        modalidade,
        premio,
        loteria: '',
        horario: '',
        ativo: true,
      },
    })
  }

  // Se não há limite configurado, não bloqueia
  if (!limiteConfig) {
    return { bloqueado: false }
  }

  // 3. Calcular total apostado neste número específico + extração + prêmio
  const valorAtual = await calcularTotalApostadoPorNumeroExtracaoPremio(
    modalidade,
    premio,
    numero,
    loteria,
    horario
  )

  const valorTotalComNovaAposta = valorAtual + valorAposta
  const bloqueado = valorTotalComNovaAposta > limiteConfig.limite

  // 4. Se atingiu o limite, bloquear automaticamente o número
  if (bloqueado) {
    await bloquearNumero(
      modalidade,
      premio,
      numero,
      loteria,
      horario,
      valorTotalComNovaAposta,
      limiteConfig.limite
    )

    const tipoNumero = numero.length === 4 ? 'milhar' : numero.length === 3 ? 'centena' : numero.length === 2 ? 'dezena' : 'número'
    const mensagem = `O ${tipoNumero} ${numero} no ${premio}º prêmio da ${loteria || 'extração'} atingiu o limite de R$ ${limiteConfig.limite.toFixed(2)}. Total apostado: R$ ${valorAtual.toFixed(2)}.`
    
    return {
      bloqueado: true,
      mensagem,
      limite: limiteConfig.limite,
      valorAtual: valorTotalComNovaAposta,
    }
  }

  return { bloqueado: false }
}
```

### 1.3. Integração na Criação de Apostas

No endpoint de criação de apostas, adicione a verificação antes de processar:

```typescript
// app/api/apostas/route.ts
import { verificarLimiteDescargaPorNumero } from '@/lib/descarga'

export async function POST(request: Request) {
  // ... código de autenticação e validação ...

  // VERIFICAR LIMITES DE DESCARGA ANTES DE PROCESSAR A APOSTA
  if (isInstant && detalhes && typeof detalhes === 'object' && 'betData' in detalhes) {
    const betData = (detalhes as any).betData

    // Para cada número apostado, verificar limite
    if (betData.numberBets && betData.numberBets.length > 0) {
      for (const numeroApostado of betData.numberBets) {
        // Extrair prêmio da posição
        const positionToUse = betData.customPosition && betData.customPositionValue 
          ? betData.customPositionValue.trim() 
          : betData.position

        // Converter posição para prêmios (ex: "1-5" = prêmios 1, 2, 3, 4, 5)
        const premios = extrairPremiosDaPosicao(positionToUse)

        for (const premio of premios) {
          const verificacao = await verificarLimiteDescargaPorNumero(
            modalidade,
            premio,
            numeroApostado.replace(/\D/g, ''), // Limpar formatação
            loteria || null,
            horario || null,
            valorNum
          )

          if (verificacao.bloqueado) {
            return NextResponse.json(
              { error: verificacao.mensagem },
              { status: 400 }
            )
          }
        }
      }
    }
  }

  // ... continuar com criação da aposta ...
}

/**
 * Extrai lista de prêmios de uma posição (ex: "1-5" = [1,2,3,4,5])
 */
function extrairPremiosDaPosicao(position: string | null): number[] {
  if (!position) return []
  
  const cleaned = position.replace(/º/g, '').replace(/\s/g, '')
  
  if (cleaned === '1st' || cleaned === '1') {
    return [1]
  } else if (cleaned.includes('-')) {
    const [from, to] = cleaned.split('-').map(Number)
    if (!isNaN(from) && !isNaN(to)) {
      return Array.from({ length: to - from + 1 }, (_, i) => from + i)
    }
  } else {
    const singlePos = parseInt(cleaned, 10)
    if (!isNaN(singlePos) && singlePos >= 1 && singlePos <= 7) {
      return [singlePos]
    }
  }
  
  return []
}
```

### 1.4. API Admin para Gerenciar Limites

Crie um endpoint admin para gerenciar limites:

```typescript
// app/api/admin/descarga/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { definirLimiteDescarga } from '@/lib/descarga'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  // Verificar se é admin
  const adminCheck = await requireAdmin(request)
  if (adminCheck instanceof NextResponse) {
    return adminCheck
  }

  try {
    const limites = await prisma.limiteDescarga.findMany({
      orderBy: [
        { modalidade: 'asc' },
        { premio: 'asc' },
      ],
    })

    return NextResponse.json({ limites })
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao buscar limites' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  // Verificar se é admin
  const adminCheck = await requireAdmin(request)
  if (adminCheck instanceof NextResponse) {
    return adminCheck
  }

  try {
    const body = await request.json()
    const { modalidade, premio, limite, loteria } = body

    if (!modalidade || !premio || limite === undefined) {
      return NextResponse.json(
        { error: 'Modalidade, prêmio e limite são obrigatórios' },
        { status: 400 }
      )
    }

    const limiteCriado = await definirLimiteDescarga({
      modalidade,
      premio: Number(premio),
      limite: Number(limite),
      loteria: loteria || '',
    })

    return NextResponse.json({
      message: 'Limite definido com sucesso',
      limite: limiteCriado,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erro ao definir limite' },
      { status: 500 }
    )
  }
}
```

---

## 2. Validação de Administrador

Sistema de autenticação e autorização para rotas administrativas.

### 2.1. Schema do Banco de Dados

Adicione o campo `admin` na tabela de usuários:

```prisma
model Usuario {
  id          Int      @id @default(autoincrement())
  nome        String
  email       String   @unique
  passwordHash String?
  admin       Boolean  @default(false) // Indica se o usuário é administrador
  // ... outros campos ...
}
```

### 2.2. Biblioteca de Autenticação (`lib/auth.ts`)

```typescript
import crypto from 'node:crypto'
import { prisma } from './prisma'

const AUTH_SECRET = process.env.AUTH_SECRET || 'dev-secret'

export interface SessionPayload {
  id: number
  email: string
  nome: string
}

/**
 * Cria token de sessão
 */
export function createSessionToken(payload: SessionPayload): string {
  return Buffer.from(JSON.stringify(payload)).toString('base64url')
}

/**
 * Decodifica token de sessão
 */
export function parseSessionToken(token?: string | null): SessionPayload | undefined {
  if (!token) return undefined
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf-8')
    return JSON.parse(decoded) as SessionPayload
  } catch (error) {
    console.error('Erro ao decodificar sessão:', error)
    return undefined
  }
}

/**
 * Verifica se o usuário é administrador
 */
export async function isAdmin(userId: number): Promise<boolean> {
  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id: userId },
      select: { admin: true },
    })
    return usuario?.admin === true
  } catch (error) {
    console.error('Erro ao verificar se usuário é admin:', error)
    return false
  }
}
```

### 2.3. Helper de Autenticação Admin (`lib/admin-auth.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { parseSessionToken, isAdmin } from './auth'

/**
 * Verifica se o usuário está autenticado e é admin
 * Retorna o userId se for admin, ou NextResponse com erro se não for
 */
export async function requireAdmin(request: NextRequest): Promise<{ userId: number } | NextResponse> {
  // Buscar cookie de sessão
  const sessionCookie = cookies().get('lotbicho_session')?.value || 
                        cookies().get('postenobicho_session')?.value
  
  if (!sessionCookie) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  // Decodificar token
  const user = parseSessionToken(sessionCookie)
  
  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  // Verificar se é admin
  const userIsAdmin = await isAdmin(user.id)
  
  if (!userIsAdmin) {
    return NextResponse.json({ 
      error: 'Acesso negado. Apenas administradores podem acessar esta rota.',
      details: `Usuário ${user.email} não possui permissões de administrador.`
    }, { status: 403 })
  }

  return { userId: user.id }
}
```

### 2.4. Uso em Rotas Admin

Use o helper em todas as rotas administrativas:

```typescript
// app/api/admin/exemplo/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'

export async function GET(request: NextRequest) {
  // Verificar se é admin
  const adminCheck = await requireAdmin(request)
  if (adminCheck instanceof NextResponse) {
    return adminCheck // Retorna erro 401 ou 403
  }

  // Se chegou aqui, é admin
  const { userId } = adminCheck

  // ... lógica da rota ...
  return NextResponse.json({ message: 'Acesso permitido' })
}

export async function POST(request: NextRequest) {
  // Verificar se é admin
  const adminCheck = await requireAdmin(request)
  if (adminCheck instanceof NextResponse) {
    return adminCheck
  }

  const { userId } = adminCheck

  // ... lógica da rota ...
  return NextResponse.json({ message: 'Operação realizada' })
}
```

### 2.5. Proteção no Frontend (Layout Admin)

```typescript
// app/admin/layout.tsx
'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const [redirected, setRedirected] = useState(false)

  useEffect(() => {
    if (pathname === '/admin/login') {
      setLoading(false)
      setIsAuthenticated(true)
      return
    }

    if (redirected) {
      return
    }

    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' })
        const data = await res.json()
        
        if (data.user) {
          // Verificar se o usuário é admin
          if (!data.user.admin) {
            setIsAuthenticated(false)
            setRedirected(true)
            // Redirecionar para home do site (não admin/login para evitar loop)
            window.location.href = '/'
            return
          }
          setIsAuthenticated(true)
        } else {
          setIsAuthenticated(false)
          setRedirected(true)
          router.push('/admin/login')
        }
      } catch (error) {
        setIsAuthenticated(false)
        setRedirected(true)
        window.location.href = '/'
      } finally {
        setLoading(false)
      }
    }
    
    checkAuth()
  }, [pathname, router, redirected])

  if (pathname === '/admin/login') {
    return <>{children}</>
  }

  if (loading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="mb-4 text-4xl">🦁</div>
          <div className="text-gray-600">Verificando autenticação...</div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
```

### 2.6. Tornar Usuário Admin

Crie um script para tornar um usuário admin:

```typescript
// scripts/tornar-usuario-admin.ts
import { prisma } from '../lib/prisma'

async function tornarAdmin(email: string) {
  const usuario = await prisma.usuario.update({
    where: { email },
    data: { admin: true },
  })
  
  console.log(`✅ Usuário ${email} agora é administrador`)
  return usuario
}

// Executar
const email = process.argv[2]
if (!email) {
  console.error('Uso: npx tsx scripts/tornar-usuario-admin.ts <email>')
  process.exit(1)
}

tornarAdmin(email)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Erro:', error)
    process.exit(1)
  })
```

---

## 3. Validação de CPF Único

Garante que apenas uma conta seja criada por CPF.

### 3.1. Schema do Banco de Dados

Adicione o campo `cpf` com constraint único:

```prisma
model Usuario {
  id          Int      @id @default(autoincrement())
  nome        String
  email       String   @unique
  cpf         String?  @unique // CPF único para validar uma conta por CPF
  // ... outros campos ...
}
```

### 3.2. Funções de Validação (`lib/auth.ts`)

```typescript
/**
 * Valida e limpa CPF (remove formatação, mantém apenas números)
 */
export function cleanCPF(cpf: string): string {
  return cpf.replace(/\D/g, '')
}

/**
 * Valida formato de CPF (11 dígitos)
 */
export function isValidCPFFormat(cpf: string): boolean {
  const cleaned = cleanCPF(cpf)
  return cleaned.length === 11 && /^\d{11}$/.test(cleaned)
}
```

### 3.3. Endpoint de Cadastro com Validação

```typescript
// app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSessionToken, hashPassword, cleanCPF, isValidCPFFormat } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { nome, email, password, telefone, cpf } = body || {}

    if (!nome || !email || !password) {
      return NextResponse.json(
        { error: 'Nome, email e senha são obrigatórios' },
        { status: 400 }
      )
    }

    // CPF é obrigatório
    if (!cpf) {
      return NextResponse.json(
        { error: 'CPF é obrigatório' },
        { status: 400 }
      )
    }

    // Validar formato do CPF
    if (!isValidCPFFormat(cpf)) {
      return NextResponse.json(
        { error: 'CPF inválido. Digite um CPF válido com 11 dígitos.' },
        { status: 400 }
      )
    }

    const cpfLimpo = cleanCPF(cpf)

    // Verificar se email já existe
    const existingEmail = await prisma.usuario.findUnique({ 
      where: { email } 
    })
    if (existingEmail) {
      return NextResponse.json(
        { error: 'Email já cadastrado' },
        { status: 409 }
      )
    }

    // Verificar se CPF já existe (uma conta por CPF)
    const existingCPF = await prisma.usuario.findUnique({ 
      where: { cpf: cpfLimpo } 
    })
    if (existingCPF) {
      return NextResponse.json(
        { error: 'CPF já cadastrado. Apenas uma conta por CPF é permitida.' },
        { status: 409 }
      )
    }

    const passwordHash = hashPassword(password)

    const user = await prisma.usuario.create({
      data: {
        nome,
        email,
        cpf: cpfLimpo,
        telefone: telefone || null,
        passwordHash,
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

    const token = createSessionToken({ 
      id: user.id, 
      email: user.email, 
      nome: user.nome 
    })
    
    const res = NextResponse.json({ 
      user, 
      message: 'Cadastro realizado com sucesso' 
    })
    
    res.cookies.set('lotbicho_session', token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 dias
    })
    
    return res
  } catch (error) {
    console.error('Erro ao cadastrar:', error)
    return NextResponse.json(
      { error: 'Erro ao cadastrar' },
      { status: 500 }
    )
  }
}
```

### 3.4. Validação no Frontend

```typescript
// components/CadastroForm.tsx
'use client'

import { useState } from 'react'

export function CadastroForm() {
  const [cpf, setCpf] = useState('')

  // Máscara de CPF
  const formatCPF = (value: string) => {
    const cleaned = value.replace(/\D/g, '')
    if (cleaned.length <= 11) {
      return cleaned
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
    }
    return cleaned.slice(0, 11)
  }

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCPF(e.target.value)
    setCpf(formatted)
  }

  return (
    <form>
      <input
        type="text"
        value={cpf}
        onChange={handleCPFChange}
        placeholder="000.000.000-00"
        maxLength={14}
      />
      {/* ... outros campos ... */}
    </form>
  )
}
```

---

## 4. Integração Completa

### 4.1. Fluxo Completo de Aposta com Descarga

```typescript
// app/api/apostas/route.ts
import { verificarLimiteDescargaPorNumero } from '@/lib/descarga'

export async function POST(request: Request) {
  // 1. Autenticação
  const session = cookies().get('lotbicho_session')?.value
  const user = parseSessionToken(session)
  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  // 2. Validar dados da aposta
  const body = await request.json()
  const { modalidade, valor, detalhes, loteria, horario } = body

  // 3. Verificar limites de descarga
  if (detalhes?.betData?.numberBets) {
    for (const numero of detalhes.betData.numberBets) {
      const premios = extrairPremiosDaPosicao(detalhes.betData.position)
      
      for (const premio of premios) {
        const verificacao = await verificarLimiteDescargaPorNumero(
          modalidade,
          premio,
          numero.replace(/\D/g, ''),
          loteria || null,
          horario || null,
          Number(valor)
        )

        if (verificacao.bloqueado) {
          return NextResponse.json(
            { error: verificacao.mensagem },
            { status: 400 }
          )
        }
      }
    }
  }

  // 4. Criar aposta
  // ... código de criação ...
}
```

### 4.2. Checklist de Implementação

- [ ] **Schema do Banco**
  - [ ] Criar tabela `LimiteDescarga`
  - [ ] Criar tabela `NumeroBloqueado`
  - [ ] Criar tabela `AlertaDescarga`
  - [ ] Adicionar campo `admin` em `Usuario`
  - [ ] Adicionar campo `cpf` único em `Usuario`

- [ ] **Bibliotecas**
  - [ ] Criar `lib/descarga.ts`
  - [ ] Criar `lib/admin-auth.ts`
  - [ ] Atualizar `lib/auth.ts` com funções de CPF

- [ ] **APIs**
  - [ ] Criar `app/api/admin/descarga/route.ts`
  - [ ] Atualizar `app/api/apostas/route.ts` com verificação de descarga
  - [ ] Atualizar `app/api/auth/register/route.ts` com validação de CPF
  - [ ] Proteger todas as rotas `/api/admin/*` com `requireAdmin`

- [ ] **Frontend**
  - [ ] Criar página admin de descarga
  - [ ] Proteger layout admin com verificação de admin
  - [ ] Adicionar campo CPF no formulário de cadastro
  - [ ] Adicionar máscara de CPF

- [ ] **Scripts**
  - [ ] Criar script para tornar usuário admin
  - [ ] Criar migração do banco de dados

---

## 5. Exemplos de Uso

### 5.1. Definir Limite de Descarga (Admin)

```bash
POST /api/admin/descarga
{
  "modalidade": "Milhar",
  "premio": 1,
  "limite": 1000.00,
  "loteria": "PT Rio"
}
```

### 5.2. Verificar Limite Antes de Apostar

```typescript
const verificacao = await verificarLimiteDescargaPorNumero(
  "Milhar",
  1,
  "1234",
  "PT Rio",
  null,
  100.00
)

if (verificacao.bloqueado) {
  console.error(verificacao.mensagem)
  // "O milhar 1234 no 1º prêmio da PT Rio atingiu o limite de R$ 1000.00."
}
```

### 5.3. Tornar Usuário Admin

```bash
npx tsx scripts/tornar-usuario-admin.ts usuario@exemplo.com
```

---

## 6. Considerações de Segurança

1. **Validação Server-Side**: Sempre valide no servidor, nunca confie apenas no frontend
2. **Sanitização**: Limpe e valide todos os inputs antes de processar
3. **Rate Limiting**: Implemente rate limiting nas APIs administrativas
4. **Logs**: Registre todas as ações administrativas
5. **HTTPS**: Use HTTPS em produção para proteger cookies de sessão

---

## 7. Troubleshooting

### Problema: Limite não está sendo respeitado
- Verifique se o limite está ativo (`ativo: true`)
- Verifique se a modalidade e prêmio correspondem exatamente
- Verifique se o número está sendo normalizado corretamente

### Problema: Usuário não consegue acessar admin
- Verifique se o campo `admin` está como `true` no banco
- Verifique se o cookie de sessão está sendo enviado
- Verifique os logs do servidor para erros de autenticação

### Problema: CPF já cadastrado mesmo sendo novo
- Verifique se o CPF está sendo limpo corretamente (apenas números)
- Verifique se há espaços ou caracteres especiais
- Verifique se o constraint único está funcionando no banco

---

## 8. Conclusão

Este guia fornece uma implementação completa de:
- ✅ Sistema de Descarga (limites de apostas por número)
- ✅ Validação de Administrador (proteção de rotas admin)
- ✅ Validação de CPF Único (uma conta por CPF)

Todas as funcionalidades estão prontas para serem integradas em qualquer sistema de apostas similar.
