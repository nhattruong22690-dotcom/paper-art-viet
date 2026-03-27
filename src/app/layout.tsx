import type { Metadata } from 'next'
import './globals.css'
import DashboardShell from '@/components/layout/DashboardShell'
import { NotificationProvider } from '@/context/NotificationContext'
import { AuthProvider } from '@/context/AuthContext'
import MaintenanceGuard from '@/components/layout/MaintenanceGuard'
import { Inter, Space_Grotesk } from 'next/font/google'

const inter = Inter({ 
  subsets: ['latin', 'vietnamese'],
  display: 'swap',
  variable: '--font-inter',
})

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin', 'vietnamese'],
  display: 'swap',
  variable: '--font-space-grotesk',
})

export const metadata: Metadata = {
  title: 'Paper Art Việt | ERP System',
  description: 'Enterprise Resource Planning for Paper Art Việt',
}

import { UIFeedbackProvider } from '@/components/providers/UIFeedbackProvider'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi" suppressHydrationWarning className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body className="antialiased bg-background text-foreground" suppressHydrationWarning>
        <NotificationProvider>
          <AuthProvider>
            <UIFeedbackProvider>
              <MaintenanceGuard>
                <DashboardShell>
                  {children}
                </DashboardShell>
              </MaintenanceGuard>
            </UIFeedbackProvider>
          </AuthProvider>
        </NotificationProvider>
      </body>
    </html>
  )
}
