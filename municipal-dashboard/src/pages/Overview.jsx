import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Truck, Users, AlertTriangle, CheckCircle, BarChart2, Trash2, MapPin, Clock } from 'lucide-react'

export default function Overview() {
  const [stats, setStats] = useState({
    collectors: 0, citizens: 0, bins: 0, pickups: 0,
    pendingPickups: 0, openComplaints: 0, collectionsToday: 0, avgFill: 0
  })
  const [recentActivity, setRecentActivity] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchStats() }, [])

  async function fetchStats() {
    setLoading(true)
    const today = new Date().toISOString().split('T')[0]

    const [collectorsRes, citizensRes, binsRes, pickupsRes,
      pendingRes, complaintsRes, collectionsRes] = await Promise.all([
      supabase.from('users').select('id', { count: 'exact' }).eq('role', 'collector'),
      supabase.from('users').select('id', { count: 'exact' }).eq('role', 'citizen'),
      supabase.from('bins').select('fill_level'),
      supabase.from('pickup_requests').select('id', { count: 'exact' }),
      supabase.from('pickup_requests').select('id', { count: 'exact' }).eq('status', 'pending'),
      supabase.from('complaints').select('id', { count: 'exact' }).eq('status', 'open'),
      supabase.from('collections_log').select('id', { count: 'exact' }).gte('timestamp', today),
    ])

    const bins = binsRes.data || []
    const avgFill = bins.length ? Math.round(bins.reduce((a, b) => a + b.fill_level, 0) / bins.length) : 0

    setStats({
      collectors: collectorsRes.count || 0,
      citizens: citizensRes.count || 0,
      bins: bins.length,
      pickups: pickupsRes.count || 0,
      pendingPickups: pendingRes.count || 0,
      openComplaints: complaintsRes.count || 0,
      collectionsToday: collectionsRes.count || 0,
      avgFill,
    })

    // Fetch recent activity
    const { data: recent } = await supabase
      .from('collections_log')
      .select('*, bins(type), users(name)')
      .order('timestamp', { ascending: false })
      .limit(6)
    setRecentActivity(recent || [])
    setLoading(false)
  }

  const statCards = [
    { label: 'Total Collectors', value: stats.collectors, icon: Truck, color: '#10b981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.2)' },
    { label: 'Total Citizens', value: stats.citizens, icon: Users, color: '#60a5fa', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.2)' },
    { label: 'Pending Pickups', value: stats.pendingPickups, icon: Clock, color: '#fbbf24', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)' },
    { label: 'Open Complaints', value: stats.openComplaints, icon: AlertTriangle, color: '#f87171', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.2)' },
    { label: 'Collections Today', value: stats.collectionsToday, icon: CheckCircle, color: '#34d399', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.2)' },
    { label: 'Avg Bin Fill', value: `${stats.avgFill}%`, icon: BarChart2, color: '#a78bfa', bg: 'rgba(139,92,246,0.1)', border: 'rgba(139,92,246,0.2)' },
    { label: 'Total Bins', value: stats.bins, icon: Trash2, color: '#fb923c', bg: 'rgba(251,146,60,0.1)', border: 'rgba(251,146,60,0.2)' },
    { label: 'Total Pickups', value: stats.pickups, icon: MapPin, color: '#38bdf8', bg: 'rgba(56,189,248,0.1)', border: 'rgba(56,189,248,0.2)' },
  ]

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Dashboard Overview</h1>
        <p className="text-slate-400 text-sm mt-1">Mumbai Municipal Corporation · Real-time data</p>
      </div>

      {/* Alert banner for pending */}
      {stats.pendingPickups > 0 && (
        <div className="rounded-xl p-4 mb-6 flex items-center gap-3"
          style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)' }}>
          <AlertTriangle size={18} style={{ color: '#fbbf24' }} />
          <p className="text-sm" style={{ color: '#fde68a' }}>
            <span className="font-semibold">{stats.pendingPickups} pickup requests</span> are pending assignment.
          </p>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {statCards.map(card => {
          const Icon = card.icon
          return (
            <div key={card.label} className="card" style={{ borderColor: card.border, background: `linear-gradient(135deg, ${card.bg}, rgba(30,41,59,0.8))` }}>
              <div className="flex items-center justify-between mb-3">
                <Icon size={18} style={{ color: card.color }} />
                <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: card.color }} />
              </div>
              <div className="text-2xl font-bold text-white mb-1">{loading ? '—' : card.value}</div>
              <div className="text-xs text-slate-400">{card.label}</div>
            </div>
          )
        })}
      </div>

      {/* Recent Collections */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-white">Recent Collections</h2>
          <span className="text-xs text-slate-500">Live feed</span>
        </div>
        {recentActivity.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-6">No collections recorded yet</p>
        ) : (
          <div className="space-y-2">
            {recentActivity.map(log => (
              <div key={log.id} className="flex items-center gap-3 py-2 border-b last:border-0"
                style={{ borderColor: 'var(--nexora-border)' }}>
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: '#10b981' }} />
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-white">{log.users?.name || 'Collector'}</span>
                  <span className="text-slate-400 text-sm"> collected </span>
                  <span className="text-sm capitalize" style={{ color: '#10b981' }}>{log.bins?.type || log.waste_type} waste</span>
                </div>
                <span className="text-xs text-slate-500 flex-shrink-0">
                  {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
