import { NextRequest } from 'next/server'

/**
 * Função helper para obter o IP real do cliente a partir do request
 */
export function getClientIP(request: Request | NextRequest | { headers: Headers }): string | null {
  let headers: Headers
  
  // Debug: verificar tipo do request
  console.log('🔍 getClientIP - Tipo do request:', request.constructor.name)
  
  // NextRequest tem headers diretamente acessíveis
  if ('headers' in request && request.headers instanceof Headers) {
    headers = request.headers
  } else if ('headers' in request && typeof request.headers === 'object' && 'get' in request.headers) {
    headers = request.headers as Headers
  } else {
    // Tentar criar Headers a partir de um objeto
    headers = new Headers()
  }
  
  // Debug: listar todos os headers disponíveis
  const allHeaders: string[] = []
  headers.forEach((value, key) => {
    allHeaders.push(`${key}: ${value}`)
  })
  console.log('🔍 Headers disponíveis:', allHeaders.length > 0 ? allHeaders.join(', ') : 'nenhum header encontrado')
  
  // Tentar vários headers comuns para obter o IP real
  // x-forwarded-for pode conter múltiplos IPs: "client, proxy1, proxy2"
  // O primeiro é geralmente o IP original do cliente
  const forwardedFor = headers.get('x-forwarded-for') || headers.get('X-Forwarded-For')
  console.log('🔍 x-forwarded-for:', forwardedFor || 'não encontrado')
  
  if (forwardedFor) {
    const ips = forwardedFor.split(',').map(ip => ip.trim())
    console.log('🔍 IPs encontrados no x-forwarded-for:', ips.join(', '))
    
    // Filtrar IPs privados/localhost e pegar o primeiro IP público
    for (const ip of ips) {
      if (ip && ip !== '::1' && ip !== '127.0.0.1' && 
          !ip.startsWith('192.168.') && !ip.startsWith('10.') && 
          !ip.startsWith('172.16.') && !ip.startsWith('172.17.') &&
          !ip.startsWith('172.18.') && !ip.startsWith('172.19.') &&
          !ip.startsWith('172.20.') && !ip.startsWith('172.21.') &&
          !ip.startsWith('172.22.') && !ip.startsWith('172.23.') &&
          !ip.startsWith('172.24.') && !ip.startsWith('172.25.') &&
          !ip.startsWith('172.26.') && !ip.startsWith('172.27.') &&
          !ip.startsWith('172.28.') && !ip.startsWith('172.29.') &&
          !ip.startsWith('172.30.') && !ip.startsWith('172.31.')) {
        console.log(`✅ IP capturado do x-forwarded-for: ${ip}`)
        return ip
      }
    }
    // Se não encontrou IP público, retornar o primeiro mesmo
    if (ips.length > 0) {
      console.log(`⚠️ Usando primeiro IP do x-forwarded-for (pode ser proxy): ${ips[0]}`)
      return ips[0]
    }
  }

  const realIP = headers.get('x-real-ip') || headers.get('X-Real-IP')
  console.log('🔍 x-real-ip:', realIP || 'não encontrado')
  if (realIP) {
    console.log(`✅ IP capturado do x-real-ip: ${realIP}`)
    return realIP.trim()
  }

  const cfConnectingIP = headers.get('cf-connecting-ip') || headers.get('CF-Connecting-IP') // Cloudflare
  if (cfConnectingIP) {
    console.log(`✅ IP capturado do cf-connecting-ip: ${cfConnectingIP}`)
    return cfConnectingIP.trim()
  }

  const trueClientIP = headers.get('true-client-ip') || headers.get('True-Client-IP') // Cloudflare Enterprise
  if (trueClientIP) {
    console.log(`✅ IP capturado do true-client-ip: ${trueClientIP}`)
    return trueClientIP.trim()
  }

  console.warn('⚠️ Não foi possível capturar IP do cliente - nenhum header encontrado')
  console.warn('⚠️ Headers disponíveis:', Array.from(headers.keys()).join(', ') || 'nenhum')
  return null
}

/**
 * Interface para dados de geolocalização
 */
export interface GeolocationData {
  ip: string
  latitude?: number
  longitude?: number
  cidade?: string
  estado?: string
  pais?: string
  regiao?: string
  timezone?: string
  isp?: string
}

/**
 * Geolocaliza um IP usando o serviço ip-api.com (gratuito, até 45 requisições/minuto)
 * Alternativa: ipapi.co (gratuito até 1000 requisições/dia)
 */
export async function geolocateIP(ip: string): Promise<GeolocationData | null> {
  if (!ip || ip === '::1' || ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) {
    // IP localhost ou privado, não pode ser geolocalizado
    return null
  }

  try {
    // Usar ip-api.com (gratuito, sem necessidade de API key)
    // Formato: http://ip-api.com/json/{ip}?fields=status,message,country,regionName,city,lat,lon,timezone,isp
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,message,country,regionName,city,lat,lon,timezone,isp`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      console.error(`Erro ao geolocalizar IP ${ip}: HTTP ${response.status}`)
      return null
    }

    const data = await response.json()

    if (data.status === 'fail') {
      console.error(`Falha ao geolocalizar IP ${ip}: ${data.message}`)
      return null
    }

    return {
      ip,
      latitude: data.lat || undefined,
      longitude: data.lon || undefined,
      cidade: data.city || undefined,
      estado: data.regionName || undefined,
      pais: data.country || undefined,
      regiao: data.regionName || undefined,
      timezone: data.timezone || undefined,
      isp: data.isp || undefined,
    }
  } catch (error) {
    console.error(`Erro ao geolocalizar IP ${ip}:`, error)
    return null
  }
}

/**
 * Salva a localização do usuário no banco de dados
 */
export async function salvarLocalizacaoUsuario(
  usuarioId: number,
  ip: string,
  tipo: 'cadastro' | 'aposta' | 'login',
  geolocationData?: GeolocationData | null
): Promise<void> {
  try {
    const { prisma } = await import('@/lib/prisma')

    await prisma.usuarioLocalizacao.create({
      data: {
        usuarioId,
        ip,
        tipo,
        latitude: geolocationData?.latitude || null,
        longitude: geolocationData?.longitude || null,
        cidade: geolocationData?.cidade || null,
        estado: geolocationData?.estado || null,
        pais: geolocationData?.pais || null,
        regiao: geolocationData?.regiao || null,
        timezone: geolocationData?.timezone || null,
        isp: geolocationData?.isp || null,
      },
    })
  } catch (error) {
    // Não bloquear o fluxo principal se houver erro ao salvar localização
    console.error(`Erro ao salvar localização do usuário ${usuarioId}:`, error)
  }
}
