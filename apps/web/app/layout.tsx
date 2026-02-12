import type { Metadata } from 'next'
import './globals.css'
import { AppHeader } from '@/components/AppHeader'
import { AppFooter } from '@/components/AppFooter'

export const metadata: Metadata = {
  title: 'Agora - Agenda de l\'Assemblée nationale',
  description: 'Consultez l\'agenda de l\'Assemblée nationale de manière simple et transparente'
}

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body>
        <div className="pageLayout">
          <AppHeader />
          <main className="pageMain">{children}</main>
          <AppFooter />
        </div>
      </body>
    </html>
  )
}
