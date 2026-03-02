'use client'
import { AppProvider } from '@/context/AppContext'
import Sidebar from './Sidebar'
import TopBar from './TopBar'

type Props = {
  children: React.ReactNode
  role: 'admin' | 'intern' | 'public'
  title: string
  breadcrumbs?: { label: string; path?: string }[]
}

export default function AppShell({ children, role, title, breadcrumbs }: Props) {
  return (
    <AppProvider>
      <div className="flex h-screen overflow-hidden bg-gray-950">
        <Sidebar role={role} />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <TopBar title={title} breadcrumbs={breadcrumbs} />
          <main className="flex-1 overflow-y-auto">
            <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </AppProvider>
  )
}
