import type { Metadata } from 'next'
import './globals.css'
import DashboardShell from '@/components/layout/DashboardShell'

export const metadata: Metadata = {
  title: 'Paper Art Việt | ERP System',
  description: 'Enterprise Resource Planning for Paper Art Việt',
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
      <body className="antialiased font-sans bg-slate-50 text-slate-900" suppressHydrationWarning>
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
