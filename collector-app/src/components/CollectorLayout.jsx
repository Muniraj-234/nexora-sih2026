import { useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Truck, LogOut, UserPlus } from 'lucide-react'
import AddCitizenModal from './AddCitizenModal'

export default function CollectorLayout({ profile }) {
  const navigate = useNavigate()
  const [showAddCitizen, setShowAddCitizen] = useState(false)

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--nexora-dark)' }}>
      <header className="glass sticky top-0 z-40 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #10b981, #0d9488)' }}>
            <Truck size={16} color="white" />
          </div>
          <div>
            <span className="font-bold text-white text-sm">Nexora</span>
            <span className="text-xs text-slate-500 ml-1">Collector</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {profile?.name && (
            <span className="text-sm text-slate-300 hidden sm:inline">{profile.name}</span>
          )}
          {/* Add Citizen button */}
          <button
            onClick={() => setShowAddCitizen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
            style={{ background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.3)', color: '#a78bfa' }}
            title="Register a new citizen"
          >
            <UserPlus size={14} />
            <span className="hidden sm:inline">Add Citizen</span>
          </button>

          <button onClick={handleLogout}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
            <LogOut size={16} />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>

      {showAddCitizen && <AddCitizenModal onClose={() => setShowAddCitizen(false)} />}
    </div>
  )
}
