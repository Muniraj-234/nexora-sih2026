import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { LayoutDashboard, MapPin, ScanLine, Clock, LogOut, Sun, Moon, Leaf } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/request-pickup', icon: MapPin, label: 'Request' },
  { path: '/scanner', icon: ScanLine, label: 'Scan' },
  { path: '/tracking', icon: MapPin, label: 'Track' },
  { path: '/my-requests', icon: Clock, label: 'History' }
]

export default function Layout({ user, profile }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { theme, toggleTheme } = useTheme()

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--nexora-bg)' }}>
      {/* Top Header */}
      <header className="glass sticky top-0 z-40 px-4 py-3 flex items-center justify-between border-b" style={{ borderColor: 'var(--nexora-border)' }}>
        <div className="flex flex-col">
          <span className="text-xs font-medium" style={{ color: 'var(--nexora-text)', opacity: 0.6 }}>Good evening,</span>
          <span className="font-bold text-sm" style={{ color: 'var(--nexora-text)' }}>{profile?.name || 'Citizen'}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-black/5" style={{ color: 'var(--nexora-text)' }}>
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button onClick={handleLogout} className="p-2 rounded-lg transition-colors" style={{ color: 'var(--nexora-text)', opacity: 0.7 }}>
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-auto pb-20 px-4 max-w-md mx-auto w-full">
        <Outlet />
      </main>

      {/* Bottom nav */}
      <nav className="glass fixed bottom-0 left-0 right-0 z-50 px-2 py-2">
        <div className="flex items-center justify-around max-w-lg mx-auto">
          {navItems.map(({ path, icon: Icon, label }) => {
            const active = location.pathname === path
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all"
                style={active ? { background: 'rgba(16,185,129,0.15)', color: '#10b981' } : { color: '#64748b' }}
              >
                <Icon size={20} />
                <span className="text-xs font-medium">{label}</span>
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
