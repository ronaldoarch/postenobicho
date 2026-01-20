import { prisma } from './prisma'

export interface HorariosConfig {
  horario09?: string | null
  horario11?: string | null
  horario14?: string | null
  horario16?: string | null
  horario18?: string | null
  horarioFederal?: string | null
  horario21?: string | null
  diasFederal?: string
  diasSem18e21?: string | null
  proximaDataSemExtracao?: Date | null
}

export async function getHorariosConfig(): Promise<HorariosConfig> {
  let config = await prisma.configuracaoHorarios.findFirst()
  
  if (!config) {
    config = await prisma.configuracaoHorarios.create({
      data: {
        horario09: '09:10',
        horario11: '11:10',
        horario14: '14:10',
        horario16: '16:10',
        horario18: '18:10',
        horarioFederal: '19:55',
        horario21: '21:10',
        diasFederal: 'Quarta,Sábado',
        diasSem18e21: 'Domingo',
      },
    })
  }
  
  return {
    horario09: config.horario09,
    horario11: config.horario11,
    horario14: config.horario14,
    horario16: config.horario16,
    horario18: config.horario18,
    horarioFederal: config.horarioFederal,
    horario21: config.horario21,
    diasFederal: config.diasFederal,
    diasSem18e21: config.diasSem18e21,
    proximaDataSemExtracao: config.proximaDataSemExtracao,
  }
}

export async function updateHorariosConfig(updates: HorariosConfig) {
  let config = await prisma.configuracaoHorarios.findFirst()
  
  const data: any = {}
  if (updates.horario09 !== undefined) data.horario09 = updates.horario09
  if (updates.horario11 !== undefined) data.horario11 = updates.horario11
  if (updates.horario14 !== undefined) data.horario14 = updates.horario14
  if (updates.horario16 !== undefined) data.horario16 = updates.horario16
  if (updates.horario18 !== undefined) data.horario18 = updates.horario18
  if (updates.horarioFederal !== undefined) data.horarioFederal = updates.horarioFederal
  if (updates.horario21 !== undefined) data.horario21 = updates.horario21
  if (updates.diasFederal !== undefined) data.diasFederal = updates.diasFederal
  if (updates.diasSem18e21 !== undefined) data.diasSem18e21 = updates.diasSem18e21
  if (updates.proximaDataSemExtracao !== undefined) data.proximaDataSemExtracao = updates.proximaDataSemExtracao
  
  if (!config) {
    return await prisma.configuracaoHorarios.create({
      data: {
        ...data,
        horario09: data.horario09 || '09:10',
        horario11: data.horario11 || '11:10',
        horario14: data.horario14 || '14:10',
        horario16: data.horario16 || '16:10',
        horario18: data.horario18 || '18:10',
        horarioFederal: data.horarioFederal || '19:55',
        horario21: data.horario21 || '21:10',
        diasFederal: data.diasFederal || 'Quarta,Sábado',
        diasSem18e21: data.diasSem18e21 || 'Domingo',
      },
    })
  }
  
  return await prisma.configuracaoHorarios.update({
    where: { id: config.id },
    data,
  })
}
