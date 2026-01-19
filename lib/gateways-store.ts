import { prisma } from './prisma'

export interface GatewayInput {
  id?: number
  name: string
  tipo?: string // receba, nxgate, etc.
  baseUrl: string
  apiKey: string
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
      webhookUrl: input.webhookUrl,
      sandbox: input.sandbox ?? true,
      active: input.active ?? true,
    },
  })
}

export async function updateGateway(id: number, input: Partial<GatewayInput>) {
  return prisma.gateway.update({
    where: { id },
    data: {
      name: input.name,
      tipo: input.tipo,
      baseUrl: input.baseUrl,
      apiKey: input.apiKey,
      webhookUrl: input.webhookUrl,
      sandbox: input.sandbox,
      active: input.active,
    },
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
