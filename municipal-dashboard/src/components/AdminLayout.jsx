import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import {
  Building2, LayoutDashboard, Map, AlertTriangle,
  Truck, Users, BarChart2, LogOut, Menu, X
} from 'lucide-react'
import { useState } from 'react'

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

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const Sidebar = () => (
    <div className="flex flex-col h-full" style={{ background: '#0c1827' }}>
      {/* Logo */}
      <div className="px-6 py-5 border-b" style={{ borderColor: 'var(--nexora-border)' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #10b981, #0d9488)' }}>
            <Building2 size={18} color="white" />
          </div>
          <div>
            <div className="font-bold text-white text-sm">Nexora</div>
            <div className="text-xs text-slate-500">Municipal Dashboard</div>
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
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={active
                ? { background: 'rgba(16,185,129,0.15)', color: '#10b981', borderLeft: '3px solid #10b981' }
                : { color: '#64748b' }}
            >
              <Icon size={18} />
              {label}
            </button>
          )
        })}
      </nav>

      {/* User info + logout */}
      <div className="px-4 py-4 border-t" style={{ borderColor: 'var(--nexora-border)' }}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
            style={{ background: 'linear-gradient(135deg, #10b981, #0d9488)' }}>
            {profile?.name?.[0] || 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-white truncate">{profile?.name || 'Admin'}</div>
            <div className="text-xs text-slate-500 capitalize">{profile?.role || 'admin'}</div>
          </div>
        </div>
        <button onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-slate-700 transition-all">
          <LogOut size={16} /> Sign Out
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--nexora-dark)' }}>
      {/* Desktop sidebar */}
      <div className="hidden lg:flex flex-col w-56 flex-shrink-0" style={{ borderRight: '1px solid var(--nexora-border)' }}>
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-56">
            <Sidebar />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar (mobile) */}
        <header className="glass lg:hidden px-4 py-3 flex items-center gap-3 flex-shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="text-slate-400">
            <Menu size={20} />
          </button>
          <span className="font-bold text-white">Nexora Municipal</span>
        </header>

        {/* Desktop top bar */}
        <header className="hidden lg:flex glass px-6 py-3 items-center justify-between flex-shrink-0">
          <div>
            <h2 className="font-semibold text-white text-sm">
              {navItems.find(n => n.path === location.pathname)?.label || 'Dashboard'}
            </h2>
            <p className="text-xs text-slate-500">Mumbai Municipal Corporation · Live</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-full"
              style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#10b981' }}>
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              System Live
            </div>
            <span className="text-sm text-slate-400">{profile?.name}</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
