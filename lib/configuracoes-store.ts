import { prisma } from './prisma'

export async function getConfiguracoes() {
  try {
    let config = await prisma.configuracao.findFirst()
    
    if (!config) {
      // Criar configuração padrão se não existir
      config = await prisma.configuracao.create({
        data: {
          nomePlataforma: 'Poste no Bicho',
          numeroSuporte: '(00) 00000-0000',
          emailSuporte: 'suporte@postenobicho.com',
          whatsappSuporte: '5500000000000',
          logoSite: '',
          liquidacaoAutomatica: true,
        },
      })
    }
    
    return config
  } catch (error) {
    console.error('Erro ao buscar configurações:', error)
    // Retornar configuração padrão em caso de erro
    // Usar 'as any' porque não temos acesso ao tipo Prisma em caso de erro
    return {
      id: 1,
      nomePlataforma: 'Poste no Bicho',
      numeroSuporte: '(00) 00000-0000',
      emailSuporte: 'suporte@postenobicho.com',
      whatsappSuporte: '5500000000000',
      logoSite: '',
      liquidacaoAutomatica: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any
  }
}

function normalizeConfiguracoes(updates: any) {
  const data: any = {}
  if (updates.nomePlataforma !== undefined) data.nomePlataforma = updates.nomePlataforma
  if (updates.numeroSuporte !== undefined) data.numeroSuporte = updates.numeroSuporte
  if (updates.emailSuporte !== undefined) data.emailSuporte = updates.emailSuporte
  if (updates.whatsappSuporte !== undefined) data.whatsappSuporte = updates.whatsappSuporte
  if (updates.logoSite !== undefined) data.logoSite = updates.logoSite
  if (updates.liquidacaoAutomatica !== undefined) data.liquidacaoAutomatica = updates.liquidacaoAutomatica
  if (updates.metaPixelId !== undefined) data.metaPixelId = updates.metaPixelId || null
  if (updates.metaAccessToken !== undefined) data.metaAccessToken = updates.metaAccessToken || null
  if (updates.metaPixelEnabled !== undefined) data.metaPixelEnabled = updates.metaPixelEnabled
  if (updates.webhookUrl !== undefined) data.webhookUrl = updates.webhookUrl || null
  if (updates.webhookEnabled !== undefined) data.webhookEnabled = updates.webhookEnabled
  if (updates.webhookSecret !== undefined) data.webhookSecret = updates.webhookSecret || null
  
  // Tratar webhookEvents: pode vir como string JSON ou array
  if (updates.webhookEvents !== undefined) {
    if (typeof updates.webhookEvents === 'string') {
      try {
        // Se for string, tentar fazer parse
        const parsed = JSON.parse(updates.webhookEvents)
        data.webhookEvents = Array.isArray(parsed) ? parsed : null
      } catch {
        // Se falhar o parse, tratar como null
        data.webhookEvents = null
      }
    } else if (Array.isArray(updates.webhookEvents)) {
      data.webhookEvents = updates.webhookEvents
    } else {
      data.webhookEvents = null
    }
  }
  
  return data
}

export async function updateConfiguracoes(updates: any) {
  try {
    let config = await prisma.configuracao.findFirst()
    const data = normalizeConfiguracoes(updates)
    
    if (!config) {
      return await prisma.configuracao.create({
        data,
      })
    }
    
    return await prisma.configuracao.update({
      where: { id: config.id },
      data,
    })
  } catch (error) {
    console.error('Erro ao atualizar configurações no banco:', error)
    throw error // Re-throw para que a rota API possa tratar
  }
}
