import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Building2, Mail, Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    setLoading(false)
  }

  // Quick demo admin login
  const demoLogin = async () => {
    setLoading(true)
    setError('')
    const demoEmail = 'admin@nexora.gov.in'
    const demoPass = 'nexora@admin123'

    let { error } = await supabase.auth.signInWithPassword({ email: demoEmail, password: demoPass })
    if (error) {
      // Create the admin account if not exists
      const { data: signupData } = await supabase.auth.signUp({ email: demoEmail, password: demoPass })
      if (signupData?.user) {
        // Upsert admin profile
        await supabase.from('users').upsert({
          id: signupData.user.id,
          role: 'admin',
          name: 'Priya Sharma (Admin)',
          phone: '9876543210',
        })
        const { error: e2 } = await supabase.auth.signInWithPassword({ email: demoEmail, password: demoPass })
        if (e2) setError(e2.message)
      }
    }
    setLoading(false)
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0f172a 0%, #0c1a2e 50%, #0f172a 100%)' }}
    >
      {/* Animated background blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full opacity-[0.07]"
          style={{ background: 'radial-gradient(circle, #10b981, transparent)', transform: 'translate(30%, -30%)' }} />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full opacity-[0.07]"
          style={{ background: 'radial-gradient(circle, #6366f1, transparent)', transform: 'translate(-30%, 30%)' }} />
        {/* Grid lines */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'linear-gradient(#10b981 1px, transparent 1px), linear-gradient(90deg, #10b981 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      </div>

      <div className="w-full max-w-md relative z-10 animate-slide-up">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-4 relative"
            style={{ background: 'linear-gradient(135deg, #10b981, #0d9488)', boxShadow: '0 0 40px rgba(16,185,129,0.4)' }}>
            <Building2 size={36} color="white" />
          </div>
          <h1 className="text-4xl font-bold text-white">Nexora</h1>
          <p className="text-emerald-400 font-semibold mt-1">Municipal Command Centre</p>
          <p className="text-slate-500 text-sm mt-1">Smart India Hackathon 2026</p>
        </div>

        {/* Login card */}
        <div className="card" style={{ boxShadow: '0 25px 60px rgba(0,0,0,0.5)' }}>
          <div className="flex items-center gap-2 mb-6">
            <ShieldCheck size={18} style={{ color: '#10b981' }} />
            <h2 className="text-lg font-bold text-white">Admin Sign In</h2>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">Email</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  className="input pl-9 w-full"
                  type="email"
                  placeholder="admin@municipality.gov.in"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  className="input pl-9 pr-10 w-full"
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl text-sm flex items-start gap-2"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#fca5a5' }}>
                ⚠️ {error}
              </div>
            )}

            <button type="submit" className="btn-primary w-full justify-center py-3 text-base" disabled={loading}>
              {loading
                ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : 'Sign In to Dashboard'}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px" style={{ background: 'var(--nexora-border)' }}></div>
            <span className="text-xs text-slate-500">or</span>
            <div className="flex-1 h-px" style={{ background: 'var(--nexora-border)' }}></div>
          </div>

          {/* Demo access */}
          <div className="rounded-xl p-4" style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)' }}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-base">🎯</span>
              <span className="text-sm font-semibold text-emerald-400">SIH Demo Access</span>
            </div>
            <div className="space-y-1 text-xs text-slate-400 mb-3">
              <p>Email: <span className="text-emerald-300 font-mono">admin@nexora.gov.in</span></p>
              <p>Password: <span className="text-emerald-300 font-mono">nexora@admin123</span></p>
            </div>
            <button
              onClick={demoLogin}
              disabled={loading}
              className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.25), rgba(13,148,136,0.25))', border: '1px solid rgba(16,185,129,0.4)', color: '#10b981', cursor: loading ? 'not-allowed' : 'pointer' }}
            >
              {loading ? 'Signing in...' : '⚡ Quick Demo Login'}
            </button>
          </div>
        </div>

        <p className="text-center text-slate-600 text-xs mt-6">
          Nexora · Municipal Waste Management · SIH 2026
        </p>
      </div>
    </div>
  )
}
