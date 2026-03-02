import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'

const inter = Inter({ subsets: ['latin'], display: 'swap' })

export const metadata: Metadata = {
  title: { default: 'Proteccio', template: '%s | Proteccio' },
  description: 'Privacy-First Intern Management Platform',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'Proteccio' },
  formatDetection: { telephone: false },
}

export const viewport: Viewport = {
  themeColor: '#2563EB',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-gray-950 text-white antialiased`}>
        <Toaster position="top-right"
          toastOptions={{
            style: { background: '#1f2937', color: '#f9fafb', border: '1px solid #374151' },
            success: { iconTheme: { primary: '#22c55e', secondary: '#f9fafb' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#f9fafb' } },
          }} />
        {children}
      </body>
    </html>
  )
}
