export interface ResultadoItem {
  position: string
  milhar: string
  grupo: string
  dezena?: string // Dezena do bicho (00-99) para mostrar na coluna grupo
  animal: string
  drawTime?: string
  loteria?: string
  location?: string
  date?: string
  estado?: string
  posicao?: number
  colocacao?: string
  horario?: string
  dataExtracao?: string
  timestamp?: string
  fonte?: string
  urlOrigem?: string
}

export interface ResultadosResponse {
  results: ResultadoItem[]
  updatedAt?: string
}
