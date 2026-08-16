import { useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Truck, LogOut, UserPlus, Sun, Moon } from 'lucide-react'
import AddCitizenModal from './AddCitizenModal'
import { useTheme } from '../context/ThemeContext'

export default function CollectorLayout({ profile }) {
  const navigate = useNavigate()
  const [showAddCitizen, setShowAddCitizen] = useState(false)
  const { theme, toggleTheme } = useTheme()

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--nexora-bg)' }}>
      <header className="glass sticky top-0 z-40 px-4 py-3 flex items-center justify-between border-b" style={{ borderColor: 'var(--nexora-border)' }}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--nexora-green)' }}>
            <Truck size={16} color="white" />
          </div>
          <div>
            <span className="font-bold text-sm" style={{ color: 'var(--nexora-text)' }}>Nexora</span>
            <span className="text-xs ml-1" style={{ color: 'var(--nexora-text)', opacity: 0.6 }}>Collector</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {profile?.name && (
            <span className="text-sm hidden sm:inline mr-2" style={{ color: 'var(--nexora-text)', opacity: 0.8 }}>{profile.name}</span>
          )}
          <button
            onClick={() => setShowAddCitizen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
            style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: '#6366f1' }}
          >
            <UserPlus size={14} />
            <span className="hidden sm:inline">Add Citizen</span>
          </button>
          
          <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-black/5" style={{ color: 'var(--nexora-text)' }}>
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <button onClick={handleLogout} className="p-2 rounded-lg transition-colors" style={{ color: 'var(--nexora-text)', opacity: 0.7 }}>
            <LogOut size={16} />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-auto px-4 max-w-md mx-auto w-full">
        <Outlet />
      </main>

      {showAddCitizen && <AddCitizenModal onClose={() => setShowAddCitizen(false)} />}
    </div>
  )
}
