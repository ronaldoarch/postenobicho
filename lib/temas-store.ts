// Store compartilhado para temas (em produção, usar banco de dados)

export interface Tema {
  id: string
  nome: string
  cores: {
    primaria: string // Cor principal (azul)
    secundaria: string // Cor secundária (amarelo)
    acento: string // Cor de destaque (vermelho)
    sucesso: string // Cor de sucesso (verde)
    texto: string // Cor do texto principal
    textoSecundario: string // Cor do texto secundário
    fundo: string // Cor de fundo
    fundoSecundario: string // Cor de fundo secundário
  }
  ativo: boolean
  criadoEm: string
  atualizadoEm: string
}

// Tema padrão baseado no banner
const temaPadrao: Tema = {
  id: 'default',
  nome: 'Tema Padrão',
  cores: {
    primaria: '#052370', // Azul profundo
    secundaria: '#FFD700', // Amarelo dourado brilhante
    acento: '#FF4444', // Vermelho
    sucesso: '#25D366', // Verde WhatsApp
    texto: '#1C1C1C', // Preto
    textoSecundario: '#4A4A4A', // Cinza
    fundo: '#F5F5F5', // Cinza claro
    fundoSecundario: '#FFFFFF', // Branco
  },
  ativo: true,
  criadoEm: new Date().toISOString(),
  atualizadoEm: new Date().toISOString(),
}

let temas: Tema[] = [temaPadrao]

export function getTemas(): Tema[] {
  return temas
}

export function getTema(id: string): Tema | undefined {
  return temas.find((t) => t.id === id)
}

export function getTemaAtivo(): Tema {
  const temaAtivo = temas.find((t) => t.ativo)
  return temaAtivo || temaPadrao
}

export function createTema(tema: Omit<Tema, 'id' | 'criadoEm' | 'atualizadoEm'>): Tema {
  const novoTema: Tema = {
    ...tema,
    id: `tema-${Date.now()}`,
    criadoEm: new Date().toISOString(),
    atualizadoEm: new Date().toISOString(),
  }
  temas.push(novoTema)
  return novoTema
}

export function updateTema(id: string, updates: Partial<Tema>): Tema | null {
  const index = temas.findIndex((t) => t.id === id)
  if (index === -1) return null

  temas[index] = {
    ...temas[index],
    ...updates,
    atualizadoEm: new Date().toISOString(),
  }
  return temas[index]
}

export function deleteTema(id: string): boolean {
  const index = temas.findIndex((t) => t.id === id)
  if (index === -1) return false

  // Não permitir deletar o tema padrão
  if (temas[index].id === 'default') return false

  temas.splice(index, 1)
  return true
}

export function setTemaAtivo(id: string): Tema | null {
  // Desativar todos os temas
  temas.forEach((t) => {
    t.ativo = false
  })

  // Ativar o tema selecionado
  const tema = temas.find((t) => t.id === id)
  if (!tema) return null

  tema.ativo = true
  tema.atualizadoEm = new Date().toISOString()
  return tema
}
