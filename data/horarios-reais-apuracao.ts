import { extracoes, type Extracao } from './extracoes'

export interface HorarioRealApuracao {
  name: string           // Nome da loteria (ex: "PT RIO", "LOOK")
  time: string           // Horário interno (ex: "09:20", "20:15")
  startTimeReal: string  // Horário inicial real (ex: "09:00")
  closeTimeReal: string  // Horário final real (ex: "09:30")
  diasSemSorteio?: number[] // Dias sem sorteio [0=Domingo, 1=Segunda, ..., 6=Sábado]
}

/**
 * Converte string de dias (ex: "Seg, Ter, Qua, Sex, Sáb") para array de números
 * onde 0=Domingo, 1=Segunda, ..., 6=Sábado
 */
function parseDiasSemSorteio(days: string): number[] {
  if (!days || days === 'Todos' || days === '—') {
    return [] // Todos os dias têm sorteio
  }
  
  const diasMap: Record<string, number> = {
    'dom': 0,
    'domingo': 0,
    'seg': 1,
    'segunda': 1,
    'ter': 2,
    'terça': 2,
    'qua': 3,
    'quarta': 3,
    'qui': 4,
    'quinta': 4,
    'sex': 5,
    'sexta': 5,
    'sab': 6,
    'sábado': 6,
    'sabado': 6,
  }
  
  const diasSemSorteio: number[] = []
  const diasComSorteio = days.toLowerCase().split(',').map(d => d.trim())
  
  // Se não menciona todos os dias, calcular quais não têm sorteio
  const todosDias = [0, 1, 2, 3, 4, 5, 6]
  const diasComSorteioNumeros = diasComSorteio
    .map(d => {
      for (const [key, value] of Object.entries(diasMap)) {
        if (d.includes(key)) return value
      }
      return null
    })
    .filter((d): d is number => d !== null)
  
  // Dias sem sorteio = todos os dias - dias com sorteio
  todosDias.forEach(dia => {
    if (!diasComSorteioNumeros.includes(dia)) {
      diasSemSorteio.push(dia)
    }
  })
  
  return diasSemSorteio
}

/**
 * Gera horários reais de apuração a partir das extrações
 */
function gerarHorariosReais(): HorarioRealApuracao[] {
  const horarios: HorarioRealApuracao[] = []
  
  extracoes.forEach(extracao => {
    if (!extracao.active || !extracao.realCloseTime) {
      return // Pular extrações inativas ou sem realCloseTime
    }
    
    // Calcular startTimeReal (geralmente 15-30 minutos antes de closeTimeReal)
    const [horaClose, minutoClose] = extracao.realCloseTime.split(':').map(Number)
    const minutosClose = horaClose * 60 + minutoClose
    
    // startTimeReal = closeTimeReal - 30 minutos (ou usar closeTime se não tiver realCloseTime)
    const minutosStart = Math.max(0, minutosClose - 30)
    const horaStart = Math.floor(minutosStart / 60)
    const minutoStart = minutosStart % 60
    const startTimeReal = `${horaStart.toString().padStart(2, '0')}:${minutoStart.toString().padStart(2, '0')}`
    
    horarios.push({
      name: extracao.name,
      time: extracao.time,
      startTimeReal,
      closeTimeReal: extracao.realCloseTime,
      diasSemSorteio: parseDiasSemSorteio(extracao.days),
    })
  })
  
  return horarios
}

// Gerar horários reais a partir das extrações
export const HORARIOS_REAIS_APURACAO: HorarioRealApuracao[] = gerarHorariosReais()

/**
 * Busca o horário real de apuração para uma loteria
 */
export function getHorarioRealApuracao(
  name: string,
  time: string
): HorarioRealApuracao | null {
  const nomeNormalizado = name.toUpperCase().trim()
  const timeNormalizado = time.trim()
  
  return HORARIOS_REAIS_APURACAO.find(
    h => h.name.toUpperCase() === nomeNormalizado &&
         h.time === timeNormalizado
  ) || null
}

/**
 * Verifica se um dia da semana tem sorteio para uma extração específica
 * 
 * @param horarioReal Horário real de apuração
 * @param diaSemana Dia da semana (0=Domingo, 1=Segunda, ..., 6=Sábado)
 * @returns true se tem sorteio, false caso contrário
 */
export function temSorteioNoDia(
  horarioReal: HorarioRealApuracao | null,
  diaSemana: number
): boolean {
  if (!horarioReal) {
    return true // Se não encontrou horário, assume que tem sorteio (comportamento antigo)
  }
  
  if (!horarioReal.diasSemSorteio || horarioReal.diasSemSorteio.length === 0) {
    return true // Todos os dias têm sorteio
  }
  
  return !horarioReal.diasSemSorteio.includes(diaSemana)
}
