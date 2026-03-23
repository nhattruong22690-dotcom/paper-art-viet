import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Sidebar from '@/components/layout/Sidebar'
import BottomNav from '@/components/layout/BottomNav'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Paper Art Việt - ERP System',
  description: 'Production Management System for Paper Art Việt',
}

import { NotificationProvider } from '@/context/NotificationContext'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <NotificationProvider>
          <div className="flex min-h-screen relative overflow-x-hidden">
            <Sidebar />
            <main className="flex-1 p-4 lg:p-8 pb-24 lg:pb-8 bg-gray-50/50 relative z-0">
              {children}
            </main>
            <BottomNav />
          </div>
        </NotificationProvider>
      </body>
    </html>
  )
}
