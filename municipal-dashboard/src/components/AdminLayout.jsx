import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import {
  Building2, LayoutDashboard, Map, AlertTriangle,
  Truck, Users, BarChart2, LogOut, Menu, Sun, Moon
} from 'lucide-react'
import { useState } from 'react'
import { useTheme } from '../context/ThemeContext'

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Overview' },
  { path: '/fleet', icon: Map, label: 'Fleet Map' },
  { path: '/collectors', icon: Truck, label: 'Collectors' },
  { path: '/citizens', icon: Users, label: 'Citizens' },
  { path: '/complaints', icon: AlertTriangle, label: 'Complaints' },
  { path: '/analytics', icon: BarChart2, label: 'Analytics' },
]

export default function AdminLayout({ profile }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { theme, toggleTheme } = useTheme()

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const Sidebar = () => (
    <div className="flex flex-col h-full shadow-2xl" style={{ background: '#022c22' }}>
      {/* Logo */}
      <div className="px-6 py-6 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg" style={{ background: '#00d632' }}>
            <Building2 size={20} color="white" />
          </div>
          <div>
            <div className="font-bold text-base text-white tracking-wide">NEXORA</div>
            <div className="text-xs font-medium text-emerald-200 opacity-80 mt-0.5">Municipal Dashboard</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ path, icon: Icon, label }) => {
          const active = location.pathname === path
          return (
            <button
              key={path}
              onClick={() => { navigate(path); setSidebarOpen(false) }}
              className="w-full flex items-center gap-3 px-4 py-3 mb-1 rounded-xl text-sm font-medium transition-all"
              style={active
                ? { background: 'rgba(0, 214, 50, 0.15)', color: '#00d632', boxShadow: 'inset 4px 0 0 #00d632' }
                : { color: 'rgba(255,255,255,0.6)' }}
            >
              <Icon size={18} style={{ opacity: active ? 1 : 0.7 }} />
              {label}
            </button>
          )
        })}
      </nav>

      {/* User info + logout */}
      <div className="px-5 py-5 border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold bg-emerald-900 text-emerald-100 border border-emerald-700">
            {profile?.name?.[0] || 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate text-white">{profile?.name || 'Admin'}</div>
            <div className="text-xs capitalize text-emerald-200 opacity-80">{profile?.role || 'admin'}</div>
          </div>
        </div>
        <button onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm transition-all hover:bg-white/10 text-emerald-100">
          <LogOut size={16} /> Sign Out
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--nexora-bg)' }}>
      {/* Desktop sidebar */}
      <div className="hidden lg:flex flex-col w-64 flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-64">
            <Sidebar />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar (mobile) */}
        <header className="glass lg:hidden px-6 py-4 flex items-center justify-between flex-shrink-0 border-b" style={{ borderColor: 'var(--nexora-border)' }}>
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} style={{ color: 'var(--nexora-text)' }}>
              <Menu size={24} />
            </button>
            <span className="font-bold text-lg tracking-wide" style={{ color: 'var(--nexora-text)' }}>NEXORA</span>
          </div>
          <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-black/5" style={{ color: 'var(--nexora-text)' }}>
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </header>

        {/* Desktop top bar */}
        <header className="hidden lg:flex glass px-8 py-5 items-center justify-between flex-shrink-0 border-b" style={{ borderColor: 'var(--nexora-border)' }}>
          <div>
            <h2 className="font-bold text-xl" style={{ color: 'var(--nexora-text)' }}>
              {navItems.find(n => n.path === location.pathname)?.label || 'Dashboard'}
            </h2>
            <p className="text-sm mt-1" style={{ color: 'var(--nexora-text)', opacity: 0.5 }}>Salem Municipal Corporation · Real-time data</p>
          </div>
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-full"
              style={{ background: 'rgba(0,214,50,0.1)', border: '1px solid rgba(0,214,50,0.2)', color: '#00d632' }}>
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              System Live
            </div>
            <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 mx-2" />
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-sm" style={{ color: 'var(--nexora-text)' }}>
                {profile?.name?.[0] || 'A'}
              </div>
              <span className="text-sm font-semibold" style={{ color: 'var(--nexora-text)' }}>{profile?.name}</span>
            </div>
            <button onClick={toggleTheme} className="p-2.5 rounded-full hover:bg-black/5 ml-2 transition-colors" style={{ color: 'var(--nexora-text)' }}>
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8" style={{ background: 'var(--nexora-bg)' }}>
          <div className="max-w-7xl mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
