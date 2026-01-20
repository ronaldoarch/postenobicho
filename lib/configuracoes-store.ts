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
  return data
}

export async function updateConfiguracoes(updates: any) {
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
}
