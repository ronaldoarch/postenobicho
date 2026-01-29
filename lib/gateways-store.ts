import { prisma } from '@/lib/prisma'

export interface GatewayInput {
  id?: number
  name: string
  tipo?: string // receba, nxgate, gatebox, etc.
  baseUrl: string
  apiKey: string
  username?: string // Para Gatebox: username de autenticação
  passwordHash?: string // Para Gatebox: password
  webhookUrl?: string
  sandbox?: boolean
  active?: boolean
}

export async function listGateways() {
  return prisma.gateway.findMany({
    orderBy: { id: 'desc' },
  })
}

export async function createGateway(input: GatewayInput) {
  return prisma.gateway.create({
    data: {
      name: input.name,
      tipo: input.tipo ?? 'receba',
      baseUrl: input.baseUrl,
      apiKey: input.apiKey,
      username: input.username,
      passwordHash: input.passwordHash,
      webhookUrl: input.webhookUrl,
      sandbox: input.sandbox ?? true,
      active: input.active ?? true,
    },
  })
}

export async function updateGateway(id: number, input: Partial<GatewayInput>) {
  // Preparar dados para atualização, tratando strings vazias como null para campos opcionais
  const updateData: any = {}
  
  if (input.name !== undefined) updateData.name = input.name
  if (input.tipo !== undefined) updateData.tipo = input.tipo
  if (input.baseUrl !== undefined) updateData.baseUrl = input.baseUrl
  if (input.apiKey !== undefined) updateData.apiKey = input.apiKey
  if (input.username !== undefined) updateData.username = input.username || null
  if (input.passwordHash !== undefined) updateData.passwordHash = input.passwordHash || null
  if (input.webhookUrl !== undefined) updateData.webhookUrl = input.webhookUrl || null
  if (input.sandbox !== undefined) updateData.sandbox = input.sandbox
  if (input.active !== undefined) updateData.active = input.active
  
  return prisma.gateway.update({
    where: { id },
    data: updateData,
  })
}

/**
 * Busca o gateway ativo de um tipo específico
 */
export async function getActiveGatewayByType(tipo: string) {
  return prisma.gateway.findFirst({
    where: {
      tipo,
      active: true,
    },
    orderBy: { id: 'desc' }, // Pega o mais recente se houver múltiplos
  })
}

export async function deleteGateway(id: number) {
  return prisma.gateway.delete({ where: { id } })
}
