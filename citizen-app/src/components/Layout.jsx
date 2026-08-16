import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Leaf, Home, Camera, MapPin, Navigation, List, LogOut } from 'lucide-react'

const navItems = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/scanner', icon: Camera, label: 'Scanner' },
  { path: '/request-pickup', icon: MapPin, label: 'Pickup' },
  { path: '/tracking', icon: Navigation, label: 'Track' },
  { path: '/my-requests', icon: List, label: 'My Requests' },
]

export default function Layout({ profile }) {
  const navigate = useNavigate()
  const location = useLocation()

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--nexora-dark)' }}>
      {/* Top header */}
      <header className="glass sticky top-0 z-50 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #10b981, #0d9488)' }}>
            <Leaf size={16} color="white" />
          </div>
          <span className="font-bold text-slate-800">Nexora</span>
          <span className="text-xs text-slate-500 hidden sm:inline">Citizen</span>
        </div>
        <div className="flex items-center gap-3">
          {profile?.name && (
            <span className="text-sm text-slate-600 hidden sm:inline">{profile.name}</span>
          )}
          <button onClick={handleLogout} className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors">
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
