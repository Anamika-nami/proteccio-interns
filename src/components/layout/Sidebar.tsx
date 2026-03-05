'use client'
import { usePathname, useRouter } from 'next/navigation'
import { useApp } from '@/context/AppContext'

const adminNav = [
  { label: 'Dashboard', path: '/admin/dashboard', icon: '⊞' },
  { label: 'Interns', path: '/admin/interns', icon: '👥' },
  { label: 'Profile', path: '/profile', icon: '👤' },
  { label: 'Governance', path: '/admin/governance', icon: '🛡' },
  { label: 'Workflow', path: '/admin/workflow', icon: '⚙' },
  { label: 'Privacy', path: '/admin/privacy', icon: '🔒' },
  { label: 'Permissions', path: '/admin/permissions', icon: '🔑' },
  { label: 'Form Builder', path: '/admin/form-builder', icon: '📝' },
  { label: 'Consent Logs', path: '/admin/consent-logs', icon: '📋' },
  { label: 'Activity Logs', path: '/admin/logs', icon: '📊' },
  { label: 'Deleted Items', path: '/admin/deleted', icon: '🗑' },
  { label: 'Settings', path: '/admin/settings', icon: '⚙' },
]

const internNav = [
  { label: 'My Portal', path: '/intern', icon: '🏠' },
  { label: 'Projects', path: '/projects', icon: '📁' },
  { label: 'Profile', path: '/profile', icon: '👤' },
]

export default function Sidebar({ role }: { role: 'admin' | 'intern' | 'public' }) {
  const pathname = usePathname()
  const router = useRouter()
  const { sidebarOpen, setSidebarOpen, signOut, config, user } = useApp()
  const appName = config['app_name'] || 'Proteccio'
  const items = role === 'admin' ? adminNav : internNav

  return (
    <>
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      <aside className={`fixed top-0 left-0 h-full w-60 bg-gray-900 border-r border-gray-800 z-40 flex flex-col transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:z-auto`}>
        <div className="flex items-center justify-between px-5 py-5 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-xs font-bold">P</div>
            <span className="font-bold text-blue-400">{appName}</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 rounded p-1">✕</button>
        </div>
        <nav className="flex-1 py-4 overflow-y-auto">
          <div className="px-3 space-y-1">
            {items.map(item => {
              const isActive = pathname === item.path || pathname.startsWith(item.path + '/')
              return (
                <button key={item.path} onClick={() => { router.push(item.path); setSidebarOpen(false) }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 text-left ${isActive ? 'bg-blue-600/20 text-blue-400 font-medium' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
                  <span className="text-base leading-none">{item.icon}</span>
                  <span>{item.label}</span>
                  {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400" />}
                </button>
              )
            })}
          </div>
        </nav>
        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold uppercase flex-shrink-0">
              {user?.email?.[0] || '?'}
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-300 truncate">{user?.email}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
            </div>
          </div>
          <button onClick={signOut} className="w-full text-xs text-red-400 hover:text-red-300 border border-red-900 hover:border-red-700 px-3 py-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500">
            Sign Out
          </button>
        </div>
      </aside>
    </>
  )
}
