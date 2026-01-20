#!/usr/bin/env npx tsx
/**
 * Script para testar se os temas estão funcionando corretamente
 */

import { prisma } from '../lib/prisma'
import { getTemas, getTemaAtivo, createTema, setTemaAtivo } from '../lib/temas-store'

async function testTemas() {
  console.log('🧪 Testando sistema de temas...\n')

  try {
    // 1. Verificar conexão com banco
    console.log('1️⃣ Verificando conexão com banco de dados...')
    await prisma.$connect()
    console.log('✅ Conexão estabelecida\n')

    // 2. Listar todos os temas
    console.log('2️⃣ Listando todos os temas...')
    const temas = await getTemas()
    console.log(`✅ Encontrados ${temas.length} tema(s)`)
    temas.forEach((tema, index) => {
      console.log(`   ${index + 1}. ${tema.nome} ${tema.ativo ? '(ATIVO)' : ''}`)
      console.log(`      Cores: Primária=${tema.cores.primaria}, Secundária=${tema.cores.secundaria}`)
      console.log(`      Texto Destaque: ${tema.cores.textoDestaque || 'não definido'}`)
      console.log(`      Texto Terciário: ${tema.cores.textoTerciario || 'não definido'}`)
    })
    console.log('')

    // 3. Verificar tema ativo
    console.log('3️⃣ Verificando tema ativo...')
    const temaAtivo = await getTemaAtivo()
    console.log(`✅ Tema ativo: ${temaAtivo.nome}`)
    console.log(`   Cores:`)
    console.log(`   - Primária: ${temaAtivo.cores.primaria}`)
    console.log(`   - Secundária: ${temaAtivo.cores.secundaria}`)
    console.log(`   - Acento: ${temaAtivo.cores.acento}`)
    console.log(`   - Sucesso: ${temaAtivo.cores.sucesso}`)
    console.log(`   - Texto: ${temaAtivo.cores.texto}`)
    console.log(`   - Texto Secundário: ${temaAtivo.cores.textoSecundario}`)
    console.log(`   - Texto Destaque: ${temaAtivo.cores.textoDestaque || temaAtivo.cores.texto}`)
    console.log(`   - Texto Terciário: ${temaAtivo.cores.textoTerciario || temaAtivo.cores.textoSecundario}`)
    console.log(`   - Fundo: ${temaAtivo.cores.fundo}`)
    console.log(`   - Fundo Secundário: ${temaAtivo.cores.fundoSecundario}`)
    console.log('')

    // 4. Verificar campos no banco
    console.log('4️⃣ Verificando campos no banco de dados...')
    const temaRaw = await prisma.tema.findFirst({
      where: { ativo: true },
    })
    if (temaRaw) {
      console.log('✅ Campos encontrados:')
      console.log(`   - textoDestaque: ${temaRaw.textoDestaque || 'NULL'}`)
      console.log(`   - textoTerciario: ${temaRaw.textoTerciario || 'NULL'}`)
    }
    console.log('')

    // 5. Verificar estrutura da API
    console.log('5️⃣ Verificando estrutura da API...')
    const temaApi = await getTemaAtivo()
    const hasTextoDestaque = temaApi.cores.textoDestaque !== undefined
    const hasTextoTerciario = temaApi.cores.textoTerciario !== undefined
    console.log(`✅ API retorna:`)
    console.log(`   - textoDestaque: ${hasTextoDestaque ? '✅' : '❌'}`)
    console.log(`   - textoTerciario: ${hasTextoTerciario ? '✅' : '❌'}`)
    console.log('')

    console.log('✅ Todos os testes concluídos!')
    console.log('\n📋 Resumo:')
    console.log(`   - Total de temas: ${temas.length}`)
    console.log(`   - Tema ativo: ${temaAtivo.nome}`)
    console.log(`   - Campos textoDestaque/textoTerciario: ${hasTextoDestaque && hasTextoTerciario ? 'OK' : 'PROBLEMA'}`)

  } catch (error: any) {
    console.error('❌ Erro durante os testes:', error.message)
    console.error(error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

testTemas()
