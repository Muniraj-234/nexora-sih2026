import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Package, Clock, CheckCircle, XCircle, Loader } from 'lucide-react'

export default function MyRequests({ profile }) {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    if (profile?.id) fetchRequests()
  }, [profile])

  async function fetchRequests() {
    setLoading(true)
    const { data } = await supabase
      .from('pickup_requests')
      .select('*')
      .eq('citizen_id', profile.id)
      .order('created_at', { ascending: false })
    setRequests(data || [])
    setLoading(false)
  }

  const filters = ['all', 'pending', 'assigned', 'completed', 'cancelled']
  const filtered = filter === 'all' ? requests : requests.filter(r => r.status === filter)

  const statusIcon = { pending: Clock, assigned: Loader, completed: CheckCircle, cancelled: XCircle }

  return (
    <div className="px-4 py-6 max-w-lg mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">My Requests</h1>
        <p className="text-slate-400 text-sm mt-1">{requests.length} total requests</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-hide">
        {filters.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all capitalize"
            style={filter === f
              ? { background: 'linear-gradient(135deg, #10b981, #0d9488)', color: 'white' }
              : { background: 'var(--nexora-card)', border: '1px solid var(--nexora-border)', color: '#64748b' }
            }
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-12">
          <Package size={40} className="mx-auto mb-3 text-slate-600" />
          <p className="text-slate-400 font-medium">No {filter !== 'all' ? filter : ''} requests</p>
          <p className="text-slate-500 text-sm mt-1">Your pickup requests will appear here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(req => {
            const Icon = statusIcon[req.status] || Clock
            return (
              <div key={req.id} className="card animate-slide-up">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.1)' }}>
                      <Package size={16} style={{ color: '#10b981' }} />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white capitalize">{req.waste_type || 'Mixed'} Waste</div>
                      <div className="text-xs text-slate-500">{new Date(req.created_at).toLocaleString()}</div>
                    </div>
                  </div>
                  <span className={`badge badge-${req.status}`}>{req.status}</span>
                </div>
                <div className="text-xs text-slate-400 flex items-center gap-1">
                  <span>📍</span>
                  <span>{req.lat.toFixed(4)}, {req.lng.toFixed(4)}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
