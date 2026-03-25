import type { Metadata } from 'next'
import { Xanh_Mono, Patrick_Hand, Libre_Baskerville } from 'next/font/google'
import './globals.css'
import DashboardShell from '@/components/layout/DashboardShell'

const typewriter = Xanh_Mono({ 
  weight: '400',
  subsets: ['latin', 'vietnamese'],
  variable: '--font-typewriter'
})

const handwriting = Patrick_Hand({
  weight: '400',
  subsets: ['latin', 'vietnamese'],
  variable: '--font-handwriting'
})

const serif = Libre_Baskerville({
  weight: ['400', '700'],
  subsets: ['latin', 'latin-ext'],
  variable: '--font-serif'
})

export const metadata: Metadata = {
  title: 'Paper Art Việt | Retro ERP',
  description: 'Handcrafted ERP Experience for Paper Art Việt',
}

import { NotificationProvider } from '@/context/NotificationContext'
import { AuthProvider } from '@/context/AuthContext'
import MaintenanceGuard from '@/components/layout/MaintenanceGuard'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={`${serif.className} ${typewriter.variable} ${handwriting.variable} ${serif.variable} bg-retro-paper antialiased`} suppressHydrationWarning>
        <NotificationProvider>
          <AuthProvider>
            <MaintenanceGuard>
              <DashboardShell>
                {children}
              </DashboardShell>
            </MaintenanceGuard>
          </AuthProvider>
        </NotificationProvider>
      </body>
    </html>
  )
}
