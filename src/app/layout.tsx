import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Proteccio Interns',
  description: 'A showcase of talent, projects, and progress from the Proteccio internship programme.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Toaster position="top-right" toastOptions={{
          success: { style: { background: '#1a2e1a', color: '#4ade80', border: '1px solid #166534' } },
          error: { style: { background: '#2e1a1a', color: '#f87171', border: '1px solid #991b1b' } },
        }} />
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  )
}
