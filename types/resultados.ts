export interface ResultadoItem {
  position: string
  milhar: string
  grupo: string
  animal: string
  drawTime?: string
  location?: string
  date?: string
  estado?: string
}

export interface ResultadosResponse {
  results: ResultadoItem[]
  updatedAt?: string
}
