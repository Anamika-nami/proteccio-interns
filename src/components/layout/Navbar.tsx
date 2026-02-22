'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/interns', label: 'Interns' },
  { href: '/projects', label: 'Projects' },
  { href: '/contact', label: 'Contact' },
]

export default function Navbar() {
  const pathname = usePathname()

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-800 bg-gray-950/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">P</div>
          <span className="text-lg font-bold text-white">Proteccio <span className="text-blue-400">Interns</span></span>
        </Link>
        <div className="flex items-center gap-6 text-sm">
          {links.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={`transition-colors hover:text-white ${pathname === link.href ? 'text-white border-b-2 border-blue-400 pb-0.5' : 'text-gray-400'}`}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/admin/login"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg transition-colors text-sm font-medium"
          >
            Admin
          </Link>
        </div>
      </div>
    </nav>
  )
}
