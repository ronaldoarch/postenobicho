'use client'

import { useEffect, useState } from 'react'

interface Aposta {
  id: number
  concurso?: string | null
  loteria?: string | null
  estado?: string | null
  horario?: string | null
  dataConcurso?: string | null
  modalidade?: string | null
  aposta?: string | null
  valor: number
  retornoPrevisto?: number | null
  status: 'pendente' | 'ganhou' | 'perdeu'
  detalhes?: any
  createdAt: string | Date
  usuarioId?: number
}

interface BilheteApostaProps {
  aposta: Aposta
  onClose?: () => void
  showPrintButton?: boolean
}

export default function BilheteAposta({ aposta, onClose, showPrintButton = true }: BilheteApostaProps) {
  const [chaveValidacao, setChaveValidacao] = useState<string>('')
  const [configuracao, setConfiguracao] = useState<{ nomePlataforma: string }>({ nomePlataforma: 'Poste no Bicho' })
  const [extracoes, setExtracoes] = useState<Array<{ id: number; name: string; time?: string }>>([])

  // Gerar chave de validação baseada no ID da aposta e timestamp
  useEffect(() => {
    const gerarChaveValidacao = async () => {
      const texto = `${aposta.id}-${aposta.createdAt}-${aposta.usuarioId}`
      // Usar Web Crypto API para gerar hash SHA-256 (mais seguro que MD5)
      const encoder = new TextEncoder()
      const data = encoder.encode(texto)
      const hashBuffer = await crypto.subtle.digest('SHA-256', data)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
      setChaveValidacao(hashHex.substring(0, 32)) // Usar primeiros 32 caracteres (similar ao MD5)
    }
    gerarChaveValidacao()
  }, [aposta.id, aposta.createdAt, aposta.usuarioId])

  // Carregar configuração da plataforma e extrações
  useEffect(() => {
    const loadConfig = async () => {
      try {
        // Carregar configuração
        const res = await fetch('/api/configuracoes')
        if (res.ok) {
          const data = await res.json()
          if (data.configuracao) {
            setConfiguracao({ nomePlataforma: data.configuracao.nomePlataforma || 'Poste no Bicho' })
          }
        }

        // Carregar extrações
        const extracoesRes = await fetch('/api/admin/extracoes')
        if (extracoesRes.ok) {
          const extracoesData = await extracoesRes.json()
          setExtracoes(extracoesData.extracoes || [])
        }
      } catch (error) {
        console.error('Erro ao carregar configuração:', error)
      }
    }
    loadConfig()
  }, [])

  // Parsear detalhes da aposta
  let detalhesObj: any = {}
  try {
    detalhesObj = typeof aposta.detalhes === 'string' 
      ? JSON.parse(aposta.detalhes) 
      : aposta.detalhes || {}
  } catch (e) {
    detalhesObj = {}
  }

  const betData = detalhesObj.betData || {}
  const hasAnimalBets = Array.isArray(betData.animalBets) && betData.animalBets.length > 0
  const hasNumberBets = Array.isArray(betData.numberBets) && betData.numberBets.length > 0
  const hasNumbers = Array.isArray(betData.numbers) && betData.numbers.length > 0

  // Formatar data e hora
  const dataConcurso = aposta.dataConcurso 
    ? new Date(aposta.dataConcurso)
    : new Date(aposta.createdAt)
  
  const dataFormatada = dataConcurso.toLocaleDateString('pt-BR', { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric' 
  })
  
  const horaFormatada = aposta.horario || dataConcurso.toLocaleTimeString('pt-BR', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })

  // Formatar chave (ID da aposta com zeros à esquerda)
  const chaveFormatada = String(aposta.id).padStart(11, '0')

  // Buscar nome e horário da loteria
  const getLoteriaInfo = () => {
    if (!aposta.loteria) return null
    
    // Se já for um nome (não numérico), retornar como está
    if (isNaN(Number(aposta.loteria))) {
      return { nome: aposta.loteria, horario: aposta.horario || '' }
    }
    
    // Buscar extração pelo ID
    const extracao = extracoes.find((e) => e.id === Number(aposta.loteria))
    if (extracao) {
      return { 
        nome: extracao.name, 
        horario: aposta.horario || extracao.time || '' 
      }
    }
    
    return { nome: aposta.loteria, horario: aposta.horario || '' }
  }

  const loteriaInfo = getLoteriaInfo()

  // Preparar lista de apostas para exibição
  const apostasList: Array<{
    tipo: string
    palpites: string
    premios?: string
    custo: number
  }> = []

  // Processar apostas de animais/grupos
  if (hasAnimalBets) {
    betData.animalBets.forEach((bet: number[]) => {
      const palpites = bet.map((n) => String(n).padStart(2, '0')).join(' ')
      // Calcular custo: se divisionType é 'each', cada palpite tem o valor completo
      // Se não, dividir o valor entre os palpites
      const custo = betData.divisionType === 'each' 
        ? aposta.valor 
        : aposta.valor / betData.animalBets.length
      
      apostasList.push({
        tipo: aposta.modalidade || 'Grupo',
        palpites,
        custo
      })
    })
  }

  // Processar apostas numéricas
  if (hasNumberBets) {
    betData.numberBets.forEach((numero: string, idx: number) => {
      // Verificar se tem posições específicas (ex: "Cerc. 12")
      let premios = ''
      if (betData.position) {
        if (betData.position.includes('-')) {
          const [from, to] = betData.position.split('-').map((p: string) => parseInt(p.trim()))
          const qtdPremios = (to || from) - (from || 1) + 1
          if (qtdPremios > 1) {
            premios = `Cerc. ${qtdPremios}`
          } else {
            premios = `P${from || 1}`
          }
        } else {
          const pos = parseInt(betData.position.replace(/º/g, '').trim())
          premios = `P${pos}`
        }
      }

      // Calcular custo: se divisionType é 'each', cada palpite tem o valor completo
      // Se não, dividir o valor entre os palpites
      const custo = betData.divisionType === 'each' 
        ? aposta.valor 
        : aposta.valor / betData.numberBets.length

      apostasList.push({
        tipo: aposta.modalidade || 'Milhar e Centena',
        palpites: numero,
        premios: premios || undefined,
        custo
      })
    })
  }

  // Fallback: se não houver apostas processadas, criar uma entrada genérica
  if (apostasList.length === 0) {
    apostasList.push({
      tipo: aposta.modalidade || 'Aposta',
      palpites: aposta.aposta || '—',
      custo: aposta.valor
    })
  }

  return (
    <div className="print:bg-white print:p-0">
      {/* Botão de fechar (apenas em tela, não na impressão) */}
      {onClose && (
        <div className="mb-4 print:hidden">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Fechar
          </button>
        </div>
      )}


      {/* Bilhete */}
      <div className="mx-auto max-w-md rounded-lg border-2 border-gray-800 bg-white p-6 print:border-0 print:shadow-none">
        {/* Header */}
        <div className="mb-4 border-b-2 border-gray-800 pb-3 text-center">
          <h1 className="text-xl font-bold text-gray-900">{configuracao.nomePlataforma}</h1>
          <div className="mt-2 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="font-semibold text-gray-700">Chave:</span>
              <span className="font-bold text-gray-900">{chaveFormatada}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-gray-700">Data/Hora:</span>
              <span className="font-bold text-gray-900">{dataFormatada} - {horaFormatada} Horas</span>
            </div>
            {loteriaInfo && (
              <div className="flex justify-between">
                <span className="font-semibold text-gray-700">Ponto:</span>
                <span className="font-bold text-gray-900">
                  {loteriaInfo.nome}{loteriaInfo.horario ? ` - ${loteriaInfo.horario}` : ''}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Detalhes das Apostas */}
        <div className="mb-4 space-y-2">
          {apostasList.map((apostaItem, idx) => (
            <div key={idx} className="flex items-start justify-between border-b border-gray-300 pb-2 last:border-b-0">
              <div className="flex-1">
                <div className="text-xs font-bold text-gray-900">{apostaItem.tipo}</div>
                {apostaItem.premios && (
                  <div className="mt-0.5 text-xs font-semibold text-gray-700">{apostaItem.premios}</div>
                )}
                <div className="mt-0.5 text-xs font-bold text-gray-900">{apostaItem.palpites}</div>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-gray-900">{apostaItem.custo.toFixed(2).replace('.', ',')}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Resumo */}
        <div className="mb-4 border-t-2 border-gray-800 pt-3">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="font-semibold text-gray-700">Valor Total:</span>
              <span className="text-lg font-bold text-gray-900">
                {aposta.valor.toFixed(2).replace('.', ',')}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-gray-600">Gravação:</span>
              <span className="text-gray-700">
                {new Date(aposta.createdAt).toLocaleString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit'
                })}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-gray-600">Impressão:</span>
              <span className="text-gray-700">
                {new Date().toLocaleString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit'
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Validação */}
        <div className="border-t-2 border-gray-800 pt-3">
          <div className="mb-2 text-center">
            <div className="mb-1 text-xs font-semibold text-gray-700">Chave de Validação</div>
            <div className="font-mono text-xs font-bold text-gray-900">{chaveValidacao}</div>
          </div>
          
          {/* Código de barras simulado (usando caracteres) */}
          <div className="mb-2 flex justify-center">
            <div className="font-mono text-[8px] leading-tight text-gray-900">
              {chaveValidacao.split('').map((char, idx) => (
                <span key={idx} className="inline-block border border-gray-400 px-0.5">
                  {char}
                </span>
              ))}
            </div>
          </div>

          {/* Número da chave repetido */}
          <div className="text-center">
            <div className="font-mono text-xs font-bold text-gray-900">{chaveFormatada}</div>
          </div>
        </div>
      </div>

      {/* Estilos para impressão */}
      <style jsx global>{`
        @media print {
          @page {
            margin: 10mm;
            size: A4;
          }
          body {
            background: white;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  )
}
