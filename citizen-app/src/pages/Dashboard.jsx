import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Camera, MapPin, Navigation, CheckCircle, Trash2, Recycle, Zap, Droplets } from 'lucide-react'

const wasteColors = {
  wet: { bg: 'rgba(59,130,246,0.15)', border: 'rgba(59,130,246,0.3)', text: '#60a5fa', icon: Droplets },
  dry: { bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.3)', text: '#fbbf24', icon: Trash2 },
  recyclable: { bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.3)', text: '#34d399', icon: Recycle },
  hazardous: { bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.3)', text: '#f87171', icon: Zap },
}

export default function Dashboard({ profile }) {
  const navigate = useNavigate()
  const [stats, setStats] = useState({ pending: 0, completed: 0, complaints: 0 })
  const [nearbyBins, setNearbyBins] = useState([])
  const [recentRequests, setRecentRequests] = useState([])

  useEffect(() => {
    fetchDashboardData()
  }, [profile])

  async function fetchDashboardData() {
    if (!profile?.id) return

    const [reqRes, complRes, binsRes] = await Promise.all([
      supabase.from('pickup_requests').select('status').eq('citizen_id', profile.id),
      supabase.from('complaints').select('id').eq('citizen_id', profile.id),
      supabase.from('bins').select('*').order('fill_level', { ascending: false }).limit(6),
    ])

    const requests = reqRes.data || []
    setStats({
      pending: requests.filter(r => r.status === 'pending').length,
      completed: requests.filter(r => r.status === 'completed').length,
      complaints: complRes.data?.length || 0,
    })
    setNearbyBins(binsRes.data || [])

    const { data: recent } = await supabase
      .from('pickup_requests')
      .select('*')
      .eq('citizen_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(3)
    setRecentRequests(recent || [])
  }

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="px-4 py-6 max-w-lg mx-auto">
      {/* Greeting */}
      <div className="mb-6 animate-slide-up">
        <p className="text-slate-400 text-sm">{greeting} 👋</p>
        <h1 className="text-2xl font-bold text-white">{profile?.name || 'Citizen'}</h1>
        <p className="text-sm text-slate-500 mt-0.5">Mumbai, Maharashtra</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Pending', value: stats.pending, color: '#fbbf24' },
          { label: 'Completed', value: stats.completed, color: '#34d399' },
          { label: 'Complaints', value: stats.complaints, color: '#f87171' },
        ].map(stat => (
          <div key={stat.label} className="card text-center p-4">
            <div className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</div>
            <div className="text-xs text-slate-400 mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Quick Actions</h2>
      <div className="grid grid-cols-2 gap-3 mb-6">
        {[
          { label: 'Scan Waste', sub: 'Identify waste type', icon: Camera, path: '/scanner', gradient: 'linear-gradient(135deg, #10b981, #0d9488)' },
          { label: 'Request Pickup', sub: 'Schedule collection', icon: MapPin, path: '/request-pickup', gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)' },
          { label: 'Live Tracking', sub: 'Track collector', icon: Navigation, path: '/tracking', gradient: 'linear-gradient(135deg, #f59e0b, #d97706)' },
          { label: 'My Requests', sub: 'View history', icon: CheckCircle, path: '/my-requests', gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)' },
        ].map(action => {
          const Icon = action.icon
          return (
            <button key={action.path} onClick={() => navigate(action.path)} className="card text-left hover:scale-[1.02] transition-transform">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: action.gradient }}>
                <Icon size={20} color="white" />
              </div>
              <div className="font-semibold text-white text-sm">{action.label}</div>
              <div className="text-xs text-slate-400 mt-0.5">{action.sub}</div>
            </button>
          )
        })}
      </div>

      {/* Nearby Bins Status */}
      <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Nearby Bins Status</h2>
      <div className="space-y-2 mb-6">
        {nearbyBins.map(bin => {
          const conf = wasteColors[bin.type] || wasteColors.dry
          const Icon = conf.icon
          const fillColor = bin.fill_level > 80 ? '#f87171' : bin.fill_level > 50 ? '#fbbf24' : '#34d399'
          return (
            <div key={bin.id} className="card flex items-center gap-3 py-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: conf.bg, border: `1px solid ${conf.border}` }}>
                <Icon size={14} style={{ color: conf.text }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-white capitalize">{bin.type} Bin</span>
                  <span className="text-xs font-bold" style={{ color: fillColor }}>{bin.fill_level}%</span>
                </div>
                <div className="w-full rounded-full h-1.5" style={{ background: 'rgba(51,65,85,0.8)' }}>
                  <div className="h-1.5 rounded-full transition-all" style={{ width: `${bin.fill_level}%`, background: fillColor }}></div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Recent requests */}
      {recentRequests.length > 0 && (
        <>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Recent Requests</h2>
          <div className="space-y-2">
            {recentRequests.map(req => (
              <div key={req.id} className="card flex items-center justify-between py-3">
                <div>
                  <div className="text-sm font-medium text-white capitalize">{req.waste_type || 'Mixed'} Waste</div>
                  <div className="text-xs text-slate-400">{new Date(req.created_at).toLocaleDateString()}</div>
                </div>
                <span className={`badge badge-${req.status}`}>{req.status}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
