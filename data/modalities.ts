import { Modality, SpecialQuotation, Position, Location } from '@/types/bet'

export const MODALITIES: Modality[] = [
  // Grid CSS preenche linha por linha, então intercalamos para aparecer em colunas:
  // Linha 1: Grupo | Milhar
  // Linha 2: Dupla de Grupo | Milhar/Centena
  // etc.
  { id: 1, name: 'Grupo', value: '1x R$ 18.00', hasLink: false },
  { id: 9, name: 'Milhar', value: '1x R$ 5000.00', hasLink: true },
  { id: 2, name: 'Dupla de Grupo', value: '1x R$ 180.00', hasLink: false },
  { id: 10, name: 'Milhar/Centena', value: '1x R$ 3300.00', hasLink: false },
  { id: 3, name: 'Terno de Grupo', value: '1x R$ 1800.00', hasLink: false },
  { id: 11, name: 'Centena', value: '1x R$ 600.00', hasLink: false },
  { id: 4, name: 'Quadra de Grupo', value: '1x R$ 5000.00', hasLink: false },
  { id: 12, name: 'Dezena', value: '1x R$ 60.00', hasLink: false },
  { id: 5, name: 'Quina de Grupo', value: '1x R$ 5000.00', hasLink: false },
  { id: 13, name: 'Milhar Invertida', value: '1x R$ 200.00', hasLink: false },
  { id: 6, name: 'Duque de Dezena', value: '1x R$ 300.00', hasLink: false },
  { id: 14, name: 'Centena Invertida', value: '1x R$ 600.00', hasLink: false },
  { id: 7, name: 'Terno de Dezena', value: '1x R$ 5000.00', hasLink: false },
  { id: 15, name: 'Dezena Invertida', value: '1x R$ 60.00', hasLink: false },
  { id: 8, name: 'Passe vai', value: '1x R$ 300.00', hasLink: false },
  { id: 16, name: 'Passe vai e vem', value: '1x R$ 150.00', hasLink: false },
  { id: 17, name: 'Quadra de Dezena', value: '1x R$ 300.00', hasLink: false },
  { id: 18, name: 'Duque de Dezena (EMD)', value: '1x R$ 300.00', hasLink: false },
  { id: 19, name: 'Terno de Dezena (EMD)', value: '1x R$ 5000.00', hasLink: false },
  { id: 20, name: 'Dezeninha', value: 'Variável', hasLink: false },
  { id: 21, name: 'Terno de Grupo Seco', value: '1x R$ 150.00', hasLink: false }, // Odd: 150x (correto)
]

export const SPECIAL_QUOTATIONS: SpecialQuotation[] = [
  { id: 1, name: 'PONTO-NOITE 18h', value: '1x R$ 7000.00', time: '18h' },
  { id: 2, name: 'PONTO-MEIO-DIA 12h', value: '1x R$ 7000.00', time: '12h' },
  { id: 3, name: 'PONTO-TARDE 15h', value: '1x R$ 7000.00', time: '15h' },
  { id: 5, name: 'PONTO-MADRUGADA', value: '1x R$ 7000.00', time: 'madrugada' },
]

export const POSITIONS: Position[] = [
  { id: '1st', label: '1º Prêmio', value: '1st' },
  { id: '1-3', label: '1º ao 3º', value: '1-3' },
  { id: '1-5', label: '1º ao 5º', value: '1-5' },
  { id: '1-7', label: '1º ao 7º', value: '1-7' },
]

export const LOCATIONS: Location[] = [
  { id: 'brasil', name: 'Brasil Poste no Bicho' },
  { id: 'df', name: 'Distrito Federal' },
  { id: 'goias', name: 'Goiás' },
]

export const SPECIAL_TIMES: Array<{ id: string; name: string; time: string }> = [
  // PONTO-CORUJA removido conforme solicitação
]
