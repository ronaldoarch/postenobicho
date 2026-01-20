import { prisma } from '@/lib/prisma'

export default async function ThemeScript() {
  // Buscar tema ativo e configurações no servidor
  let temaCores = {
    primaria: '#052370',
    secundaria: '#FFD700',
    acento: '#FF4444',
    sucesso: '#25D366',
    texto: '#1C1C1C',
    textoSecundario: '#4A4A4A',
    textoDestaque: '#1F2937',
    textoTerciario: '#6B7280',
    fundo: '#F5F5F5',
    fundoSecundario: '#FFFFFF',
  }
  
  let nomePlataforma = 'Poste no Bicho'

  try {
    // Buscar tema ativo
    const tema = await prisma.tema.findFirst({
      where: { ativo: true },
    })
    
    if (tema) {
      temaCores = {
        primaria: tema.primaria,
        secundaria: tema.secundaria,
        acento: tema.acento,
        sucesso: tema.sucesso,
        texto: tema.texto,
        textoSecundario: tema.textoSecundario,
        textoDestaque: tema.textoDestaque || tema.texto,
        textoTerciario: tema.textoTerciario || tema.textoSecundario,
        fundo: tema.fundo,
        fundoSecundario: tema.fundoSecundario,
      }
    }

    // Buscar configurações
    const config = await prisma.configuracao.findFirst()
    if (config?.nomePlataforma) {
      nomePlataforma = config.nomePlataforma
    }
  } catch (error) {
    console.error('Erro ao carregar tema/configurações no servidor:', error)
  }

  // Escapar valores para uso seguro em JavaScript
  const escapeJs = (str: string) => {
    return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '\\"').replace(/\n/g, '\\n')
  }

  return (
    <>
      {/* Style tag inline para aplicar CSS antes de qualquer renderização */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            :root {
              --tema-primaria: ${temaCores.primaria};
              --tema-secundaria: ${temaCores.secundaria};
              --tema-acento: ${temaCores.acento};
              --tema-sucesso: ${temaCores.sucesso};
              --tema-texto: ${temaCores.texto};
              --tema-texto-secundario: ${temaCores.textoSecundario};
              --tema-texto-destaque: ${temaCores.textoDestaque};
              --tema-texto-terciario: ${temaCores.textoTerciario};
              --tema-fundo: ${temaCores.fundo};
              --tema-fundo-secundario: ${temaCores.fundoSecundario};
            }
          `,
        }}
      />
      {/* Script para garantir aplicação e armazenar nome da plataforma */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            !(function() {
              // Executar imediatamente, antes de qualquer renderização
              const root = document.documentElement;
              root.style.setProperty('--tema-primaria', '${escapeJs(temaCores.primaria)}');
              root.style.setProperty('--tema-secundaria', '${escapeJs(temaCores.secundaria)}');
              root.style.setProperty('--tema-acento', '${escapeJs(temaCores.acento)}');
              root.style.setProperty('--tema-sucesso', '${escapeJs(temaCores.sucesso)}');
              root.style.setProperty('--tema-texto', '${escapeJs(temaCores.texto)}');
              root.style.setProperty('--tema-texto-secundario', '${escapeJs(temaCores.textoSecundario)}');
              root.style.setProperty('--tema-texto-destaque', '${escapeJs(temaCores.textoDestaque)}');
              root.style.setProperty('--tema-texto-terciario', '${escapeJs(temaCores.textoTerciario)}');
              root.style.setProperty('--tema-fundo', '${escapeJs(temaCores.fundo)}');
              root.style.setProperty('--tema-fundo-secundario', '${escapeJs(temaCores.fundoSecundario)}');
              
              // Armazenar nome da plataforma para uso imediato
              window.__NOME_PLATAFORMA__ = ${JSON.stringify(nomePlataforma)};
            })();
          `,
        }}
      />
    </>
  )
}
