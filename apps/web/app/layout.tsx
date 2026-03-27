import type { Metadata } from 'next'
import { Sora, Figtree, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { Shell } from '@/components/Shell'

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800']
})

const figtree = Figtree({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
  weight: ['400', '500', '600', '700']
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
  weight: ['400', '500', '600']
})

export const metadata: Metadata = {
  title: 'Agora - Agenda de l\'Assemblée nationale',
  description: 'Consultez l\'agenda de l\'Assemblée nationale de manière simple et transparente',
  openGraph: {
    siteName: 'Agora - Assemblée nationale',
    type: 'website',
    locale: 'fr_FR'
  },
  twitter: {
    card: 'summary_large_image'
  }
}

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="fr"
      className={`${sora.variable} ${figtree.variable} ${jetbrainsMono.variable}`}
    >
      <body>
        <Shell>{children}</Shell>
      </body>
    </html>
  )
}
