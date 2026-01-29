'use client'

import { useEffect, useRef } from 'react'

interface Localizacao {
  id: number
  ip: string
  tipo: 'cadastro' | 'aposta' | 'login'
  latitude: number | null
  longitude: number | null
  cidade: string | null
  estado: string | null
  pais: string | null
  createdAt: string
  Usuario?: {
    id: number
    nome: string
    email: string
  }
}

interface MapaLocalizacoesProps {
  localizacoes: Localizacao[]
}

export default function MapaLocalizacoes({ localizacoes }: MapaLocalizacoesProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])

  useEffect(() => {
    // Carregar Leaflet apenas no cliente
    if (typeof window === 'undefined') return

    const loadMap = async () => {
      try {
        // Carregar CSS do Leaflet
        const link = document.createElement('link')
        link.rel = 'stylesheet'
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
        link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY='
        link.crossOrigin = ''
        document.head.appendChild(link)

        // Carregar JS do Leaflet
        const script = document.createElement('script')
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
        script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo='
        script.crossOrigin = ''
        
        await new Promise((resolve, reject) => {
          script.onload = resolve
          script.onerror = reject
          document.head.appendChild(script)
        })

        const L = (window as any).L

        if (!mapRef.current) return

        // Inicializar mapa (centro no Brasil)
        const map = L.map(mapRef.current).setView([-14.235, -51.9253], 4)

        // Adicionar tile layer (OpenStreetMap)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19,
        }).addTo(map)

        mapInstanceRef.current = map

        // Limpar marcadores anteriores
        markersRef.current.forEach((marker) => marker.remove())
        markersRef.current = []

        // Adicionar marcadores
        const localizacoesComCoordenadas = localizacoes.filter(
          (loc) => loc.latitude && loc.longitude
        )

        // Agrupar por coordenadas para evitar sobreposição
        const coordenadasMap = new Map<string, Localizacao[]>()

        localizacoesComCoordenadas.forEach((loc) => {
          const key = `${loc.latitude?.toFixed(2)}_${loc.longitude?.toFixed(2)}`
          if (!coordenadasMap.has(key)) {
            coordenadasMap.set(key, [])
          }
          coordenadasMap.get(key)!.push(loc)
        })

        // Criar marcadores
        coordenadasMap.forEach((locs, key) => {
          const loc = locs[0] // Pegar primeira localização do grupo
          if (!loc.latitude || !loc.longitude) return

          // Escolher cor e ícone baseado no tipo
          let color = '#3388ff' // Azul padrão
          let iconHtml = ''
          
          if (loc.tipo === 'cadastro') {
            color = '#3b82f6' // Azul
            // Ícone especial para cadastros importantes (como Cristo Redentor)
            iconHtml = `
              <div style="position: relative;">
                <div style="background-color: ${color}; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center;">
                  <span style="font-size: 12px;">📍</span>
                </div>
                <div style="position: absolute; top: -8px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 8px solid ${color};"></div>
              </div>
            `
          } else if (loc.tipo === 'aposta') {
            color = '#10b981' // Verde
            iconHtml = `
              <div style="position: relative;">
                <div style="background-color: ${color}; width: 18px; height: 18px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
                  <span style="font-size: 10px;">💰</span>
                </div>
              </div>
            `
          } else {
            color = '#6b7280' // Cinza
            iconHtml = `<div style="background-color: ${color}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`
          }

          // Criar ícone customizado
          const icon = L.divIcon({
            className: 'custom-marker',
            html: iconHtml,
            iconSize: loc.tipo === 'cadastro' ? [20, 28] : loc.tipo === 'aposta' ? [18, 18] : [12, 12],
            iconAnchor: loc.tipo === 'cadastro' ? [10, 28] : loc.tipo === 'aposta' ? [9, 9] : [6, 6],
            popupAnchor: loc.tipo === 'cadastro' ? [0, -28] : [0, -9],
          })

          // Criar popup com informações
          const popupContent = `
            <div style="min-width: 200px;">
              <strong>${loc.Usuario?.nome || 'N/A'}</strong><br/>
              <small>${loc.Usuario?.email || 'N/A'}</small><br/>
              <hr style="margin: 8px 0;"/>
              <strong>Tipo:</strong> ${loc.tipo === 'cadastro' ? 'Cadastro' : loc.tipo === 'aposta' ? 'Aposta' : 'Login'}<br/>
              ${loc.cidade && loc.estado ? `<strong>Local:</strong> ${loc.cidade}, ${loc.estado}<br/>` : ''}
              ${loc.pais ? `<strong>País:</strong> ${loc.pais}<br/>` : ''}
              <strong>IP:</strong> ${loc.ip}<br/>
              <strong>Data:</strong> ${new Date(loc.createdAt).toLocaleString('pt-BR')}<br/>
              ${locs.length > 1 ? `<small style="color: #666;">+${locs.length - 1} outras localizações neste ponto</small>` : ''}
            </div>
          `

          const marker = L.marker([loc.latitude, loc.longitude], { icon })
            .addTo(map)
            .bindPopup(popupContent)

          markersRef.current.push(marker)
        })

        // Ajustar zoom para mostrar todos os marcadores
        if (markersRef.current.length > 0) {
          const group = new (L as any).FeatureGroup(markersRef.current)
          map.fitBounds(group.getBounds().pad(0.1))
        }
      } catch (error) {
        console.error('Erro ao carregar mapa:', error)
      }
    }

    loadMap()

    // Cleanup
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
      }
      markersRef.current.forEach((marker) => marker.remove())
    }
  }, [localizacoes])

  return (
    <div className="rounded-lg border border-gray-300 shadow-lg">
      <div ref={mapRef} style={{ height: '600px', width: '100%' }} />
    </div>
  )
}
