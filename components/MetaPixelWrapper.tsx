import { prisma } from '@/lib/prisma'
import MetaPixel from './MetaPixel'

export default async function MetaPixelWrapper() {
  try {
    const config = await prisma.configuracao.findFirst()
    
    if (!config?.metaPixelEnabled || !config?.metaPixelId) {
      return null
    }
    
    return <MetaPixel pixelId={config.metaPixelId} />
  } catch (error) {
    console.error('Erro ao carregar Meta Pixel:', error)
    return null
  }
}
