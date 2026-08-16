import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import {
  Users, Plus, X, Mail, User, Phone, Lock,
  CheckCircle, AlertCircle, Loader, Search, Trash2, Calendar
} from 'lucide-react'

export default function Citizens() {
  const [citizens, setCitizens] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [search, setSearch] = useState('')
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState('')
  const [formSuccess, setFormSuccess] = useState('')

  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' })

  useEffect(() => { fetchCitizens() }, [])

  async function fetchCitizens() {
    setLoading(true)
    const { data } = await supabase
      .from('users').select('*').eq('role', 'citizen')
      .order('created_at', { ascending: false })
    setCitizens(data || [])
    setLoading(false)
  }

  async function handleAddCitizen(e) {
    e.preventDefault()
    setFormLoading(true)
    setFormError('')
    setFormSuccess('')

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    })
    if (authError) { setFormError(authError.message); setFormLoading(false); return }

    if (authData?.user) {
      const { error: dbError } = await supabase.from('users').upsert({
        id: authData.user.id, role: 'citizen', name: form.name, phone: form.phone,
      })
      if (dbError) { setFormError('Profile save failed: ' + dbError.message); setFormLoading(false); return }
    }

    setFormSuccess(`✅ Citizen "${form.name}" registered successfully!`)
    setForm({ name: '', email: '', phone: '', password: '' })
    fetchCitizens()
    setFormLoading(false)
  }

  async function handleDelete(id, name) {
    if (!confirm(`Remove citizen "${name}"?`)) return
    await supabase.from('users').delete().eq('id', id)
    fetchCitizens()
  }

  const filtered = citizens.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search)
  )

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p style={{ color: 'var(--nexora-text)', opacity: 0.6 }} className="text-sm font-medium">{citizens.length} registered citizens</p>
        </div>
        <button onClick={() => { setShowModal(true); setFormError(''); setFormSuccess('') }}
          className="btn-primary" style={{ width: 'auto', padding: '12px 24px' }}>
          <Plus size={18} /> Add Citizen
        </button>
      </div>

      <div className="relative mb-6">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 opacity-50" style={{ color: 'var(--nexora-text)' }} />
        <input className="input !pl-11 w-full h-full min-h-[3.5rem]" placeholder="Search by name or phone..."
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
        {[
          { label: 'Total Citizens', value: citizens.length, color: '#60a5fa' },
          { label: 'Registered Today', value: citizens.filter(c => new Date(c.created_at).toDateString() === new Date().toDateString()).length, color: '#34d399' },
        ].map(s => (
          <div key={s.label} className="card text-center py-6 flex flex-col justify-center transition-transform hover:-translate-y-1 hover:shadow-lg">
            <div className="text-3xl font-extrabold mb-2 tracking-tight" style={{ color: s.color }}>{s.value}</div>
            <div className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--nexora-text)', opacity: 0.6 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-12">
          <Users size={40} className="mx-auto mb-3 text-slate-600" />
          <p className="text-slate-400">No citizens found</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map(citizen => (
            <div key={citizen.id} className="card flex items-center gap-5 p-5 transition-colors hover:bg-black/5">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-lg"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white' }}>
                {citizen.name?.[0]?.toUpperCase() || 'C'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-base mb-1" style={{ color: 'var(--nexora-text)' }}>{citizen.name}</div>
                <div className="flex items-center gap-4 flex-wrap" style={{ color: 'var(--nexora-text)', opacity: 0.6 }}>
                  {citizen.phone && <span className="text-sm font-medium flex items-center gap-1.5"><Phone size={14} />{citizen.phone}</span>}
                  <span className="text-sm font-medium flex items-center gap-1.5"><Calendar size={14} />Joined {new Date(citizen.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              <button onClick={() => handleDelete(citizen.id, citizen.name)}
                className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-all">
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Citizen Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative w-full max-w-md animate-slide-up">
            <div className="card" style={{ boxShadow: '0 25px 60px rgba(0,0,0,0.6)' }}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                    <Users size={20} color="white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">Register Citizen</h3>
                    <p className="text-xs text-slate-400">Creates login for Citizen App</p>
                  </div>
                </div>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white p-1">
                  <X size={20} />
                </button>
              </div>

              {formSuccess ? (
                <div className="text-center py-6">
                  <CheckCircle size={48} className="mx-auto mb-3" style={{ color: '#10b981' }} />
                  <p className="text-white font-semibold mb-1">Citizen Registered!</p>
                  <p className="text-sm text-slate-400 mb-4">{formSuccess}</p>
                  <div className="flex gap-2">
                    <button onClick={() => { setFormSuccess(''); setShowModal(false) }} className="btn-primary flex-1" style={{ padding: '10px' }}>Done</button>
                    <button onClick={() => setFormSuccess('')} className="flex-1 py-2.5 rounded-xl text-sm font-semibold border text-slate-300" style={{ border: '1px solid var(--nexora-border)', cursor: 'pointer' }}>Add Another</button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleAddCitizen} className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">Full Name *</label>
                    <div className="relative">
                      <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input className="input pl-9 w-full" placeholder="e.g. Anjali Mehta"
                        value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">Email *</label>
                    <div className="relative">
                      <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input className="input pl-9 w-full" type="email" placeholder="citizen@email.com"
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
                        value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required minLength={6} />
                    </div>
                  </div>

                  {formError && (
                    <div className="p-3 rounded-xl flex items-start gap-2 text-sm"
                      style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#fca5a5' }}>
                      <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />{formError}
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setShowModal(false)}
                      className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-slate-300 border transition-all hover:bg-slate-700"
                      style={{ border: '1px solid var(--nexora-border)', cursor: 'pointer' }}>Cancel</button>
                    <button type="submit" className="btn-primary flex-1" style={{ padding: '10px' }} disabled={formLoading}>
                      {formLoading ? <Loader size={16} className="animate-spin" /> : <Plus size={16} />}
                      {formLoading ? 'Registering...' : 'Register'}
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
