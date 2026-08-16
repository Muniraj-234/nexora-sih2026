import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { AlertTriangle, CheckCircle, Clock, Search, ExternalLink, RefreshCw } from 'lucide-react'

const STATUS_OPTIONS = ['open', 'in_progress', 'resolved']

export default function Complaints() {
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [updating, setUpdating] = useState(null)

  useEffect(() => { fetchComplaints() }, [])

  async function fetchComplaints() {
    setLoading(true)
    const { data } = await supabase
      .from('complaints')
      .select('*, users(name, phone)')
      .order('created_at', { ascending: false })
    setComplaints(data || [])
    setLoading(false)
  }

  async function updateStatus(id, newStatus) {
    setUpdating(id)
    await supabase.from('complaints').update({ status: newStatus }).eq('id', id)
    setComplaints(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c))
    setUpdating(null)
  }

  const statusCounts = {
    open: complaints.filter(c => c.status === 'open').length,
    in_progress: complaints.filter(c => c.status === 'in_progress').length,
    resolved: complaints.filter(c => c.status === 'resolved').length,
  }

  const filtered = complaints.filter(c => {
    const matchFilter = filter === 'all' || c.status === filter
    const matchSearch = !search || c.description?.toLowerCase().includes(search.toLowerCase()) || c.users?.name?.toLowerCase().includes(search.toLowerCase())
    return matchFilter && matchSearch
  })

  const statusColor = { open: '#f87171', in_progress: '#a78bfa', resolved: '#34d399' }
  const statusIcon = { open: AlertTriangle, in_progress: Clock, resolved: CheckCircle }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Complaints</h1>
          <p className="text-slate-400 text-sm mt-1">{complaints.length} total complaints</p>
        </div>
        <button onClick={fetchComplaints} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-all">
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Status summary */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { key: 'open', label: 'Open', count: statusCounts.open },
          { key: 'in_progress', label: 'In Progress', count: statusCounts.in_progress },
          { key: 'resolved', label: 'Resolved', count: statusCounts.resolved },
        ].map(s => (
          <div key={s.key} className="card text-center py-4 cursor-pointer transition-all hover:scale-[1.02]"
            onClick={() => setFilter(filter === s.key ? 'all' : s.key)}
            style={filter === s.key ? { borderColor: statusColor[s.key], background: `${statusColor[s.key]}10` } : {}}>
            <div className="text-2xl font-bold" style={{ color: statusColor[s.key] }}>{s.count}</div>
            <div className="text-xs text-slate-400 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input className="input pl-9 w-full" placeholder="Search by description or citizen name..."
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5">
        {['all', 'open', 'in_progress', 'resolved'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className="px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-all"
            style={filter === f
              ? { background: 'linear-gradient(135deg, #10b981, #0d9488)', color: 'white' }
              : { background: 'var(--nexora-card)', border: '1px solid var(--nexora-border)', color: '#64748b' }}>
            {f === 'all' ? 'All' : f.replace('_', ' ')}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-12">
          <AlertTriangle size={40} className="mx-auto mb-3 text-slate-600" />
          <p className="text-slate-400">No complaints found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(complaint => {
            const Icon = statusIcon[complaint.status] || AlertTriangle
            return (
              <div key={complaint.id} className="card animate-slide-up">
                <div className="flex items-start gap-4">
                  {/* Photo */}
                  {complaint.photo_url && (
                    <img src={complaint.photo_url} alt="Complaint"
                      className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                      onError={e => e.target.style.display = 'none'} />
                  )}

                  <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <div className="font-semibold text-white text-sm">{complaint.users?.name || 'Unknown Citizen'}</div>
                        {complaint.users?.phone && (
                          <div className="text-xs text-slate-400">{complaint.users.phone}</div>
                        )}
                      </div>
                      <span className={`badge badge-${complaint.status} flex-shrink-0`}>
                        {complaint.status.replace('_', ' ')}
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-slate-300 mb-2 leading-relaxed">{complaint.description || 'No description provided'}</p>

                    {/* Location + time */}
                    <div className="flex items-center gap-3 text-xs text-slate-400 mb-3 flex-wrap">
                      <span>📍 {complaint.lat.toFixed(4)}, {complaint.lng.toFixed(4)}</span>
                      <span>🕐 {new Date(complaint.created_at).toLocaleString()}</span>
                    </div>

                    {/* Status actions */}
                    <div className="flex gap-2 flex-wrap">
                      {STATUS_OPTIONS.filter(s => s !== complaint.status).map(s => (
                        <button
                          key={s}
                          onClick={() => updateStatus(complaint.id, s)}
                          disabled={updating === complaint.id}
                          className="text-xs px-3 py-1.5 rounded-lg font-medium capitalize transition-all"
                          style={{ background: `${statusColor[s]}15`, color: statusColor[s], border: `1px solid ${statusColor[s]}40`, cursor: 'pointer' }}>
                          {updating === complaint.id ? '...' : `Mark ${s.replace('_', ' ')}`}
                        </button>
                      ))}
                      <a
                        href={`https://www.openstreetmap.org/?mlat=${complaint.lat}&mlon=${complaint.lng}&zoom=17`}
                        target="_blank" rel="noopener noreferrer"
                        className="text-xs px-3 py-1.5 rounded-lg font-medium flex items-center gap-1 transition-all"
                        style={{ background: 'rgba(99,102,241,0.15)', color: '#a78bfa', border: '1px solid rgba(99,102,241,0.3)' }}>
                        <ExternalLink size={11} /> View on Map
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
