import type { Metadata } from 'next'
import './globals.css'
import { Shell } from '@/components/Shell'

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
    <html lang="fr">
      <body>
        <Shell>{children}</Shell>
      </body>
    </html>
  )
}
