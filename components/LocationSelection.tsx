'use client'

import { useEffect, useMemo, useState } from 'react'
import { SPECIAL_TIMES } from '@/data/modalities'

interface Extracao {
  id: number
  name: string
  estado?: string
  realCloseTime?: string
  closeTime: string
  time: string
  active: boolean
  max: number
  days: string
}

type ExtracaoWithMeta = Extracao & {
  closeStr?: string
  closeDate?: Date
  minutesToClose: number
}

interface LocationSelectionProps {
  instant: boolean
  location: string | null
  specialTime: string | null
  selectedExtracoes?: string[] // IDs das extrações selecionadas
  onInstantChange: (checked: boolean) => void
  onLocationChange: (locationId: string) => void
  onSpecialTimeChange: (timeId: string | null) => void
  onSelectedExtracoesChange?: (extracoes: string[]) => void // Callback para múltiplas seleções
}

const CLOSE_THRESHOLD_MINUTES = 5

const MAX_SELECTED_EXTRACOES = 3

export default function LocationSelection({
  instant,
  location,
  specialTime,
  selectedExtracoes = [],
  onInstantChange,
  onLocationChange,
  onSpecialTimeChange,
  onSelectedExtracoesChange,
}: LocationSelectionProps) {
  const [extracoes, setExtracoes] = useState<Extracao[]>([])
  const [loading, setLoading] = useState(true)
  const [openStates, setOpenStates] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/admin/extracoes')
        const data = await res.json()
        // Filtrar apenas extrações ativas (todas as extrações, sem limitação de estado)
        setExtracoes((data?.extracoes || []).filter((e: Extracao) => e.active))
      } catch (error) {
        console.error('Erro ao carregar extrações', error)
      } finally {
        setLoading(false)
      }
    }
    load()
    const timer = setInterval(load, 60_000) // refresca a cada 1 min para trocar automática
    return () => clearInterval(timer)
  }, [])

  const now = Date.now()

  const normalized = useMemo(() => {
    return extracoes
      .map((e) => {
        // realCloseTime = quando fecha no site (para de aceitar apostas)
        // closeTime = quando acontece a apuração no bicho certo
        const closeStr = e.realCloseTime || e.closeTime || e.time
        const closeDate = parseTimeToday(closeStr)
        const minutesToClose = closeDate ? (closeDate.getTime() - now) / 60000 : Number.POSITIVE_INFINITY
        return { ...e, closeStr, closeDate, minutesToClose }
      })
      .sort((a, b) => (a.closeDate?.getTime() || 0) - (b.closeDate?.getTime() || 0))
  }, [extracoes, now])

  const available = normalized.filter((e) => e.minutesToClose > CLOSE_THRESHOLD_MINUTES)

  const groupedByEstado = useMemo(() => {
    const groups: Record<string, ExtracaoWithMeta[]> = {}
    for (const ext of normalized) {
      const key = ext.estado || 'Outros'
      if (!groups[key]) groups[key] = []
      groups[key].push(ext)
    }
    // ordena estados alfabeticamente
    return Object.entries(groups)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([estado, items]) => ({ estado, items }))
  }, [normalized])

  const toggleEstado = (estado: string) => {
    setOpenStates((prev) => ({ ...prev, [estado]: !prev[estado] }))
  }

  useEffect(() => {
    // abre todos por padrão na primeira carga
    if (groupedByEstado.length > 0 && Object.keys(openStates).length === 0) {
      const next: Record<string, boolean> = {}
      groupedByEstado.forEach((g) => {
        next[g.estado] = true
      })
      setOpenStates(next)
    }
  }, [groupedByEstado, openStates])

  // Handler para toggle de seleção múltipla
  const handleExtracaoToggle = (extracaoId: string) => {
    if (!onSelectedExtracoesChange) {
      // Fallback para comportamento antigo (seleção única)
      onLocationChange(extracaoId)
      return
    }

    const idStr = extracaoId.toString()
    const isSelected = selectedExtracoes.includes(idStr)
    
    if (isSelected) {
      // Remover da seleção
      onSelectedExtracoesChange(selectedExtracoes.filter(id => id !== idStr))
    } else {
      // Adicionar à seleção (máximo 3)
      if (selectedExtracoes.length < MAX_SELECTED_EXTRACOES) {
        onSelectedExtracoesChange([...selectedExtracoes, idStr])
      } else {
        // Mostrar aviso de limite atingido
        alert(`Você pode selecionar no máximo ${MAX_SELECTED_EXTRACOES} extrações.`)
      }
    }
  }

  // Manter compatibilidade: se não há callback de múltiplas seleções, usar seleção única
  useEffect(() => {
    if (!onSelectedExtracoesChange && available.length > 0 && normalized.length > 0) {
      const current =
        available.find((e) => e.id.toString() === location) ||
        (available.length > 0 ? available[0] : normalized[0])
      if (!location && current) {
        onLocationChange(current.id.toString())
      }
      if (location && current && current.id.toString() !== location) {
        onLocationChange(current.id.toString())
      }
    }
  }, [available, normalized, location, onLocationChange, onSelectedExtracoesChange])

  return (
    <div>
      <h2 className="mb-6 text-xl font-bold text-gray-950">
        Selecione até {MAX_SELECTED_EXTRACOES} extrações (valor será dividido entre elas):
      </h2>
      
      {selectedExtracoes.length > 0 && onSelectedExtracoesChange && (
        <div className="mb-4 rounded-lg bg-blue/10 p-3">
          <p className="text-sm font-semibold text-blue-800">
            {selectedExtracoes.length} extração(ões) selecionada(s)
          </p>
          <p className="text-xs text-gray-600 mt-1">
            O valor será dividido igualmente entre as {selectedExtracoes.length} extrações selecionadas.
          </p>
        </div>
      )}

      {/* Instant Checkbox */}
      <div className="mb-6">
        <label className="flex cursor-pointer items-center gap-3 rounded-lg border-2 border-gray-200 bg-white p-4 hover:border-blue/50 transition-colors">
          <input
            type="checkbox"
            checked={instant}
            onChange={(e) => onInstantChange(e.target.checked)}
            className="h-5 w-5 accent-blue"
          />
          <span className="text-lg font-semibold text-gray-950">INSTANTANEA</span>
        </label>
      </div>

      {/* Extrações do banco agrupadas por estado */}
      <div className="mb-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-950">Extrações ativas (troca automática perto do fechamento):</h3>

        {loading && <p className="text-sm text-gray-500">Carregando extrações...</p>}

        {!loading && normalized.length === 0 && (
          <p className="text-sm text-red-600">Nenhuma extração encontrada.</p>
        )}

        <div className="space-y-3">
          {groupedByEstado.map((group) => (
            <div key={group.estado} className="overflow-hidden rounded-xl border border-blue/60">
              <button
                type="button"
                onClick={() => toggleEstado(group.estado)}
                className="flex w-full items-center justify-between bg-blue/5 px-4 py-3 text-left text-sm font-semibold text-gray-900"
              >
                <span className="flex items-center gap-2">
                  <span className="inline-block h-2.5 w-2.5 rounded-full bg-blue"></span>
                  {group.estado}
                </span>
                <span className="text-lg text-blue">{openStates[group.estado] ? '▾' : '▸'}</span>
              </button>
              {openStates[group.estado] && (
                <div className="grid grid-cols-1 gap-3 p-3 md:grid-cols-3">
                  {group.items.map((ext) => {
                    const extIdStr = ext.id.toString()
                    const isSelected = onSelectedExtracoesChange 
                      ? selectedExtracoes.includes(extIdStr)
                      : location === extIdStr
                    const isClosingSoon = ext.minutesToClose <= CLOSE_THRESHOLD_MINUTES && ext.minutesToClose > 0
                    const closed = ext.minutesToClose <= 0
                    const canSelect = !closed && (!onSelectedExtracoesChange || selectedExtracoes.length < MAX_SELECTED_EXTRACOES || isSelected)
                    
                    return (
                      <label
                        key={ext.id}
                        className={`flex flex-col items-start rounded-lg border-2 p-4 transition-all cursor-pointer ${
                          isSelected ? 'border-blue bg-blue/10 shadow-lg' : 'border-gray-200 bg-white hover:border-blue/50'
                        } ${closed ? 'opacity-50 cursor-not-allowed' : canSelect ? 'hover:scale-[1.01]' : 'opacity-60 cursor-not-allowed'}`}
                      >
                        <div className="flex w-full items-start gap-2">
                          {onSelectedExtracoesChange && (
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleExtracaoToggle(extIdStr)}
                              disabled={closed || (!isSelected && selectedExtracoes.length >= MAX_SELECTED_EXTRACOES)}
                              className="mt-1 h-5 w-5 accent-blue flex-shrink-0"
                            />
                          )}
                          <div className="flex-1">
                            <div className="flex w-full items-center justify-between">
                              <span className="font-semibold text-gray-950">{ext.name}</span>
                              <span className="text-xs font-medium text-gray-500">#{ext.id}</span>
                            </div>
                            <div className="mt-1 text-sm text-gray-700">
                              Fecha às <strong>{ext.closeStr}</strong>
                              {ext.realCloseTime && ext.realCloseTime !== ext.closeTime && (
                                <span className="text-xs text-gray-500"> (real: {ext.realCloseTime})</span>
                              )}
                            </div>
                            <div className="mt-1 text-xs text-gray-500">Dias: {ext.days}</div>
                            {closed ? (
                              <span className="mt-2 inline-flex w-fit rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-600">
                                Encerrada
                              </span>
                            ) : isClosingSoon ? (
                              <span className="mt-2 inline-flex w-fit rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700">
                                Fechando em {Math.max(1, Math.floor(ext.minutesToClose))} min
                              </span>
                            ) : (
                              <span className="mt-2 inline-flex w-fit rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">
                                Aberta
                              </span>
                            )}
                          </div>
                        </div>
                      </label>
                    )
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Horários especiais */}
      {!instant && SPECIAL_TIMES.length > 0 && (
        <div className="mb-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-950">Horários Especiais:</h3>
          <div className="space-y-3">
            {SPECIAL_TIMES.map((time) => (
              <label
                key={time.id}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border-2 p-4 transition-colors ${
                  specialTime === time.id
                    ? 'border-blue bg-blue/10'
                    : 'border-gray-200 bg-white hover:border-blue/50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={specialTime === time.id}
                  onChange={(e) => onSpecialTimeChange(e.target.checked ? time.id : null)}
                  className="h-5 w-5 accent-blue"
                />
                <span className="font-semibold text-gray-950">{time.name}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function parseTimeToday(time: string | undefined) {
  if (!time) return undefined
  const [h, m] = time.split(':').map((v) => parseInt(v, 10))
  if (Number.isNaN(h) || Number.isNaN(m)) return undefined
  const d = new Date()
  d.setHours(h, m, 0, 0)
  return d
}
