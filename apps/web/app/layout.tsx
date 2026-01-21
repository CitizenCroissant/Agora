import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Agora - Agenda de l\'Assemblée nationale',
  description: 'Consultez l\'agenda de l\'Assemblée nationale de manière simple et transparente',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  )
}
