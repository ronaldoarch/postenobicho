import type { Metadata } from 'next'
import './globals.css'
import TemaProvider from '@/components/TemaProvider'
import DynamicTitle from '@/components/DynamicTitle'
import DynamicFavicon from '@/components/DynamicFavicon'
import ThemeScript from '@/components/ThemeScript'
import MetaPixelWrapper from '@/components/MetaPixelWrapper'

export const metadata: Metadata = {
  title: 'Poste no Bicho',
  description: 'Jogue no Jogo do Bicho Online e concorra a até R$ 1 milhão com um palpite! 100% seguro, com saque imediato via Pix.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <head>
        <ThemeScript />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://code.iconify.design/3/3.1.1/iconify.min.css" />
      </head>
      <body className="antialiased">
        <MetaPixelWrapper />
        <TemaProvider>
          <DynamicTitle />
          <DynamicFavicon />
          {children}
        </TemaProvider>
      </body>
    </html>
  )
}
