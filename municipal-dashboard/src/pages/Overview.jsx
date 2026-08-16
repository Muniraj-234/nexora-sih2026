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
    { label: 'Total Bins', value: stats.bins, icon: Trash2, color: '#00d632', bg: 'rgba(0,214,50,0.1)', border: 'rgba(0,214,50,0.2)' },
    { label: 'Pending Pickups', value: stats.pendingPickups, icon: Clock, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.2)' },
    { label: 'Open Complaints', value: stats.openComplaints, icon: AlertTriangle, color: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.2)' },
    { label: 'Total Pickups', value: stats.pickups, icon: MapPin, color: '#f97316', bg: 'rgba(249,115,22,0.1)', border: 'rgba(249,115,22,0.2)' },
    { label: 'Total Collectors', value: stats.collectors, icon: Truck, color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', border: 'rgba(139,92,246,0.2)' },
    { label: 'Total Citizens', value: stats.citizens, icon: Users, color: '#06b6d4', bg: 'rgba(6,182,212,0.1)', border: 'rgba(6,182,212,0.2)' },
    { label: 'Avg Bin Fill', value: `${stats.avgFill}%`, icon: BarChart2, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)' },
    { label: 'Collections Today', value: stats.collectionsToday, icon: CheckCircle, color: '#10b981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.2)' },
  ]

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Page Title Header */}
      <div className="hidden lg:block mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: 'var(--nexora-text)' }}>Overview</h1>
      </div>

      {/* Alert banner for pending */}
      {stats.pendingPickups > 0 && (
        <div className="rounded-xl p-4 mb-6 flex items-center gap-3"
          style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)' }}>
          <AlertTriangle size={18} style={{ color: '#fbbf24' }} />
          <p className="text-sm" style={{ color: '#d97706' }}>
            <span className="font-semibold">{stats.pendingPickups} pickup requests</span> are pending assignment.
          </p>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {statCards.map(card => {
          const Icon = card.icon
          return (
            <div key={card.label} className="card relative overflow-hidden transition-transform hover:-translate-y-1 hover:shadow-lg" style={{ borderColor: card.border }}>
              <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
                <Icon size={64} style={{ color: card.color }} />
              </div>
              <div className="relative z-10 flex flex-col h-full">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm" style={{ background: card.bg }}>
                    <Icon size={24} style={{ color: card.color }} />
                  </div>
                  <div className="text-sm font-semibold" style={{ color: 'var(--nexora-text)', opacity: 0.7 }}>{card.label}</div>
                </div>
                <div className="text-4xl font-extrabold tracking-tight" style={{ color: 'var(--nexora-text)' }}>{loading ? '—' : card.value}</div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Recent Collections */}
      <div className="card shadow-md border-0 ring-1" style={{ ringColor: 'var(--nexora-border)' }}>
        <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: 'var(--nexora-border)' }}>
          <h2 className="text-lg font-bold" style={{ color: 'var(--nexora-text)' }}>Recent Collections</h2>
          <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider" style={{ background: 'rgba(0, 214, 50, 0.1)', color: '#00d632' }}>Live feed</span>
        </div>
        {recentActivity.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--nexora-bg)' }}>
               <Truck size={24} style={{ color: 'var(--nexora-text)', opacity: 0.5 }} />
            </div>
            <p className="font-medium" style={{ color: 'var(--nexora-text)', opacity: 0.6 }}>No collections recorded yet</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'var(--nexora-border)' }}>
            {recentActivity.map(log => (
              <div key={log.id} className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-black/5">
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(0, 214, 50, 0.15)', color: '#00d632' }}>
                  <Truck size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-0.5">
                    <span className="font-bold text-base" style={{ color: 'var(--nexora-text)' }}>{log.users?.name || 'Collector'}</span>
                    <span className="text-sm" style={{ color: 'var(--nexora-text)', opacity: 0.6 }}>collected</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold capitalize" style={{ background: 'rgba(0, 214, 50, 0.15)', color: '#00d632' }}>
                      {log.bins?.type || log.waste_type} Waste
                    </span>
                  </div>
                </div>
                <div className="text-sm font-medium flex-shrink-0 px-3 py-1 rounded-lg" style={{ background: 'var(--nexora-bg)', color: 'var(--nexora-text)', opacity: 0.7 }}>
                  {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
