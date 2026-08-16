import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Users, Plus, X, Mail, User, Phone, Lock, CheckCircle, AlertCircle, Loader } from 'lucide-react'

export default function AddCitizenModal({ onClose }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Create auth account
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    })

    if (authError) { setError(authError.message); setLoading(false); return }

    // Insert profile
    if (authData?.user) {
      const { error: dbError } = await supabase.from('users').upsert({
        id: authData.user.id,
        role: 'citizen',
        name: form.name,
        phone: form.phone,
      })
      if (dbError) { setError('Profile save failed: ' + dbError.message); setLoading(false); return }
    }

    setSuccess(`✅ Citizen "${form.name}" registered! They can now log in to the Citizen App.`)
    setForm({ name: '', email: '', phone: '', password: '' })
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md animate-slide-up">
        <div className="card" style={{ boxShadow: '0 25px 60px rgba(0,0,0,0.6)' }}>
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                <Users size={20} color="white" />
              </div>
              <div>
                <h3 className="font-bold text-white">Register Citizen</h3>
                <p className="text-xs text-slate-400">Add a new citizen to the system</p>
              </div>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
              <X size={20} />
            </button>
          </div>

          {success ? (
            <div className="text-center py-6">
              <CheckCircle size={48} className="mx-auto mb-3" style={{ color: '#10b981' }} />
              <p className="text-white font-semibold mb-1">Citizen Registered!</p>
              <p className="text-sm text-slate-400 mb-5">{success}</p>
              <div className="flex gap-2">
                <button onClick={onClose} className="btn-primary flex-1" style={{ padding: '10px' }}>Done</button>
                <button onClick={() => setSuccess('')}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold border text-slate-300 cursor-pointer"
                  style={{ border: '1px solid var(--nexora-border)' }}>
                  Add Another
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {[
                { key: 'name', label: 'Full Name *', icon: User, type: 'text', placeholder: 'e.g. Anjali Mehta', required: true },
                { key: 'email', label: 'Email *', icon: Mail, type: 'email', placeholder: 'citizen@email.com', required: true },
                { key: 'phone', label: 'Phone', icon: Phone, type: 'tel', placeholder: '9876543210', required: false },
                { key: 'password', label: 'Password *', icon: Lock, type: 'password', placeholder: 'Min 6 characters', required: true, minLength: 6 },
              ].map(field => {
                const Icon = field.icon
                return (
                  <div key={field.key}>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">{field.label}</label>
                    <div className="relative">
                      <Icon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        className="input pl-9 w-full"
                        type={field.type}
                        placeholder={field.placeholder}
                        value={form[field.key]}
                        onChange={e => setForm(p => ({ ...p, [field.key]: e.target.value }))}
                        required={field.required}
                        minLength={field.minLength}
                      />
                    </div>
                  </div>
                )
              })}

              {error && (
                <div className="p-3 rounded-xl flex items-start gap-2 text-sm"
                  style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#fca5a5' }}>
                  <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />{error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-slate-300 border hover:bg-slate-700 transition-all cursor-pointer"
                  style={{ border: '1px solid var(--nexora-border)' }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary flex-1" style={{ padding: '10px' }} disabled={loading}>
                  {loading ? <Loader size={16} className="animate-spin" /> : <Plus size={16} />}
                  {loading ? 'Registering...' : 'Register Citizen'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
