export interface ResultData {
  position: string
  milhar: string
  grupo: string
  animal: string
}

export const SAMPLE_RESULTS: ResultData[] = [
  { position: '1°', milhar: '7938', grupo: '10', animal: 'Coelho' },
  { position: '2°', milhar: '0941', grupo: '11', animal: 'Cavalo' },
  { position: '3°', milhar: '0141', grupo: '11', animal: 'Cavalo' },
  { position: '4°', milhar: '4752', grupo: '13', animal: 'Galo' },
  { position: '5°', milhar: '3354', grupo: '14', animal: 'Gato' },
  { position: '6°', milhar: '7126', grupo: '07', animal: 'Carneiro' },
  { position: '7°', milhar: '0469', grupo: '18', animal: 'Porco' },
]

export const LOCATIONS = [
  'Rio de Janeiro',
  'São Paulo',
  'Belo Horizonte',
  'Brasília',
  'Goiás',
  'Distrito Federal',
]

export const DRAW_TIMES = [
  'PT-RIO 9h20',
  'PONTO-NOITE 18h',
  'PONTO-MEIO-DIA 12h',
  'PONTO-TARDE 15h',
  'PONTO-CORUJA 22h',
  'PONTO-MADRUGADA',
]
