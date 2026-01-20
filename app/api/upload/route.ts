import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string // 'banner' ou 'logo'

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 })
    }

    // Validar tipo de arquivo
    const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo']
    const allowedTypes = [...allowedImageTypes, ...allowedVideoTypes]
    
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Tipo de arquivo não permitido. Use imagens (JPG, PNG, WEBP, GIF) ou vídeos (MP4, WEBM, MOV, AVI)' }, { status: 400 })
    }

    // Validar tamanho (max 50MB para vídeos, 5MB para imagens)
    const isVideo = allowedVideoTypes.includes(file.type)
    const maxSize = isVideo ? 50 * 1024 * 1024 : 5 * 1024 * 1024 // 50MB para vídeos, 5MB para imagens
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: isVideo 
          ? 'Vídeo muito grande (máximo 50MB)' 
          : 'Imagem muito grande (máximo 5MB)' 
      }, { status: 400 })
    }

    // Determinar diretório baseado no tipo
    let uploadDir = 'banners'
    if (type === 'logo') {
      uploadDir = 'logos'
    } else if (type === 'story') {
      uploadDir = isVideo ? 'stories/videos' : 'stories'
    }
    const uploadPath = join(process.cwd(), 'public', 'uploads', uploadDir)

    // Criar diretório se não existir
    try {
      if (!existsSync(uploadPath)) {
        await mkdir(uploadPath, { recursive: true })
        console.log(`📁 Diretório criado: ${uploadPath}`)
      }
    } catch (mkdirError) {
      console.error('Erro ao criar diretório:', mkdirError)
      return NextResponse.json({ error: 'Erro ao criar diretório de upload' }, { status: 500 })
    }

    // Gerar nome único para o arquivo
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2, 15)
    const extension = file.name.split('.').pop()
    const fileName = `${timestamp}-${randomStr}.${extension}`
    const filePath = join(uploadPath, fileName)

    // Converter File para Buffer e salvar
    try {
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      await writeFile(filePath, buffer)
      
      // Verificar se o arquivo foi realmente salvo
      if (!existsSync(filePath)) {
        console.error(`❌ Arquivo não foi salvo: ${filePath}`)
        return NextResponse.json({ error: 'Erro ao salvar arquivo' }, { status: 500 })
      }
      
      console.log(`✅ Arquivo salvo: ${filePath}`)
    } catch (writeError) {
      console.error('Erro ao salvar arquivo:', writeError)
      return NextResponse.json({ error: 'Erro ao salvar arquivo no servidor' }, { status: 500 })
    }

    // Retornar URL do arquivo (usar rota interna para garantir entrega em qualquer ambiente)
    const fileUrl = `/uploads/${uploadDir}/${fileName}`

    return NextResponse.json({
      success: true,
      url: fileUrl,
      fileName,
    })
  } catch (error) {
    console.error('Erro ao fazer upload:', error)
    return NextResponse.json({ error: 'Erro ao fazer upload do arquivo' }, { status: 500 })
  }
}
