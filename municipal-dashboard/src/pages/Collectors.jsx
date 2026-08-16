import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import {
  Truck, Plus, X, Mail, User, Phone, Lock,
  CheckCircle, AlertCircle, Loader, Search,
  MapPin, Calendar, Trash2
} from 'lucide-react'

export default function Collectors() {
  const [collectors, setCollectors] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [search, setSearch] = useState('')
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState('')
  const [formSuccess, setFormSuccess] = useState('')
  const [routes, setRoutes] = useState([])

  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: ''
  })

  useEffect(() => {
    fetchCollectors()
    fetchRoutes()
  }, [])

  async function fetchCollectors() {
    setLoading(true)
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'collector')
      .order('created_at', { ascending: false })
    setCollectors(data || [])
    setLoading(false)
  }

  async function fetchRoutes() {
    const today = new Date().toISOString().split('T')[0]
    const { data } = await supabase
      .from('collector_routes')
      .select('*')
      .eq('date', today)
    setRoutes(data || [])
  }

  async function handleAddCollector(e) {
    e.preventDefault()
    setFormLoading(true)
    setFormError('')
    setFormSuccess('')

    // 1. Create auth user via Supabase auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { role: 'collector', name: form.name }
      }
    })

    if (authError) {
      setFormError(authError.message)
      setFormLoading(false)
      return
    }

    // 2. Insert into users table
    if (authData?.user) {
      const { error: dbError } = await supabase.from('users').upsert({
        id: authData.user.id,
        role: 'collector',
        name: form.name,
        phone: form.phone,
      })

      if (dbError) {
        setFormError('Account created but profile save failed: ' + dbError.message)
        setFormLoading(false)
        return
      }
    }

    setFormSuccess(`✅ Collector "${form.name}" added! They can now log in to the Collector App.`)
    setForm({ name: '', email: '', phone: '', password: '' })
    fetchCollectors()
    setFormLoading(false)
  }

  async function handleDelete(collectorId, collectorName) {
    if (!confirm(`Remove collector "${collectorName}"?`)) return
    await supabase.from('users').delete().eq('id', collectorId)
    fetchCollectors()
  }

  const filtered = collectors.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search)
  )

  const getCollectorRoute = (collectorId) =>
    routes.find(r => r.collector_id === collectorId)

  return (
    <div className="w-full">
      {/* Page header actions */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <p style={{ color: 'var(--nexora-text)', opacity: 0.6 }} className="text-sm font-medium">{collectors.length} registered collectors</p>
        </div>
        <button
          onClick={() => { setShowModal(true); setFormError(''); setFormSuccess('') }}
          className="btn-primary"
          style={{ width: 'auto', padding: '10px 20px' }}
        >
          <Plus size={18} /> Add Collector
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 opacity-50" style={{ color: 'var(--nexora-text)' }} />
        <input
          className="input !pl-11 w-full h-full min-h-[3.5rem]"
          placeholder="Search name/phone..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        {[
          { label: 'Total', value: collectors.length, color: '#00d632' },
          { label: 'On Duty Today', value: routes.length, color: '#3b82f6' },
          { label: 'Active GPS', value: routes.filter(r => r.current_lat).length, color: '#f97316' },
        ].map(s => (
          <div key={s.label} className="card text-center py-6 flex flex-col justify-center transition-transform hover:-translate-y-1 hover:shadow-lg">
            <div className="text-3xl font-extrabold mb-2 tracking-tight" style={{ color: s.color }}>{s.value}</div>
            <div className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--nexora-text)', opacity: 0.6 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Collector list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-12">
          <Truck size={40} className="mx-auto mb-3 text-slate-600" />
          <p className="text-slate-400">No collectors found</p>
          <button onClick={() => setShowModal(true)} className="btn-primary mt-4 mx-auto" style={{ width: 'auto' }}>
            <Plus size={16} /> Add First Collector
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map(collector => {
            const todayRoute = getCollectorRoute(collector.id)
            const hasGps = !!todayRoute?.current_lat
            // Assuming updated within last hour means active, else last known (simplified since no updated_at column known)
            const isActive = hasGps // Normally we'd check `todayRoute.updated_at`
            
            return (
              <div key={collector.id} className="card flex items-center gap-6 p-5 transition-colors hover:bg-black/5">
                {/* Avatar */}
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 text-lg font-bold"
                  style={{ background: 'linear-gradient(135deg, #10b981, #0d9488)', color: 'white' }}>
                  {collector.name?.[0]?.toUpperCase() || 'C'}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap mb-1">
                    <span className="font-bold text-base" style={{ color: 'var(--nexora-text)' }}>{collector.name}</span>
                    <span className="badge" style={{
                      background: hasGps ? 'rgba(0,214,50,0.1)' : 'rgba(100,116,139,0.1)',
                      color: hasGps ? '#00d632' : '#64748b',
                      border: `1px solid ${hasGps ? 'rgba(0,214,50,0.2)' : 'rgba(100,116,139,0.2)'}`
                    }}>
                      <span className="inline-block w-1.5 h-1.5 rounded-full mr-1.5"
                        style={{ background: hasGps ? '#00d632' : '#64748b', verticalAlign: 'middle' }} />
                      {hasGps ? 'GPS Active / Last Known' : 'No GPS Data'}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-1 flex-wrap">
                    {collector.phone && (
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Phone size={11} /> {collector.phone}
                      </span>
                    )}
                    {todayRoute && (
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <MapPin size={11} /> {todayRoute.ordered_bin_ids?.length || 0} stops today
                      </span>
                    )}
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Calendar size={11} /> Joined {new Date(collector.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* GPS position */}
                {hasGps && (
                  <div className="text-right hidden sm:block">
                    <div className="text-sm font-medium mb-1" style={{ color: '#00d632' }}>
                      {todayRoute.current_lat.toFixed(4)}, {todayRoute.current_lng.toFixed(4)}
                    </div>
                    <div className="text-xs font-semibold uppercase tracking-wider flex items-center justify-end gap-1" style={{ color: 'var(--nexora-text)', opacity: 0.5 }}>
                      <MapPin size={10} /> Last Known
                    </div>
                  </div>
                )}

                {/* Delete */}
                <button
                  onClick={() => handleDelete(collector.id, collector.name)}
                  className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-all flex-shrink-0"
                  title="Remove collector"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Add Collector Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative w-full max-w-md animate-slide-up">
            <div className="card" style={{ boxShadow: '0 25px 60px rgba(0,0,0,0.6)' }}>
              {/* Modal header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, #10b981, #0d9488)' }}>
                    <Truck size={20} color="white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">Add New Collector</h3>
                    <p className="text-xs text-slate-400">Creates login credentials for collector app</p>
                  </div>
                </div>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white p-1">
                  <X size={20} />
                </button>
              </div>

              {formSuccess ? (
                <div className="text-center py-6">
                  <CheckCircle size={48} className="mx-auto mb-3" style={{ color: '#10b981' }} />
                  <p className="text-white font-semibold mb-2">Collector Added!</p>
                  <p className="text-sm text-slate-400 mb-4">{formSuccess}</p>
                  <div className="flex gap-2">
                    <button onClick={() => { setFormSuccess(''); setShowModal(false) }}
                      className="btn-primary flex-1" style={{ padding: '10px' }}>
                      Done
                    </button>
                    <button onClick={() => setFormSuccess('')}
                      className="flex-1 py-2.5 rounded-xl text-sm font-semibold border text-slate-300"
                      style={{ border: '1px solid var(--nexora-border)', cursor: 'pointer' }}>
                      Add Another
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleAddCollector} className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">Full Name *</label>
                    <div className="relative">
                      <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input className="input pl-9 w-full" placeholder="e.g. Ramesh Kumar"
                        value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">Email *</label>
                    <div className="relative">
                      <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input className="input pl-9 w-full" type="email" placeholder="collector@email.com"
                        value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">Phone</label>
                    <div className="relative">
                      <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input className="input pl-9 w-full" placeholder="9876543210"
                        value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">Password *</label>
                    <div className="relative">
                      <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input className="input pl-9 w-full" type="password" placeholder="Min 6 characters"
                        value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                        required minLength={6} />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Collector will use this to log into the Collector App</p>
                  </div>

                  {formError && (
                    <div className="p-3 rounded-xl flex items-start gap-2 text-sm"
                      style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#fca5a5' }}>
                      <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                      {formError}
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setShowModal(false)}
                      className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-slate-300 border transition-all hover:bg-slate-700"
                      style={{ border: '1px solid var(--nexora-border)', cursor: 'pointer' }}>
                      Cancel
                    </button>
                    <button type="submit" className="btn-primary flex-1" style={{ padding: '10px' }} disabled={formLoading}>
                      {formLoading ? <Loader size={16} className="animate-spin" /> : <Plus size={16} />}
                      {formLoading ? 'Creating...' : 'Add Collector'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
