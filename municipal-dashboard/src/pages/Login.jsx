import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Building2, Mail, Lock, Eye, EyeOff, Sun, Moon } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

export default function Login() {
  const { theme, toggleTheme } = useTheme()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const demoLogin = async () => {
    setLoading(true)
    setError('')
    const { error: err } = await supabase.auth.signInWithPassword({ email: 'admin@nexora.demo', password: 'nexora123' })
    if (err) {
      const { data: signupData } = await supabase.auth.signUp({ email: 'admin@nexora.demo', password: 'nexora123' })
      if (signupData?.user) {
        await supabase.from('users').upsert({
          id: signupData.user.id,
          role: 'admin',
          name: 'Priya Sharma (Admin)',
          phone: '9876543210',
        })
      }
      const { error: err2 } = await supabase.auth.signInWithPassword({ email: 'admin@nexora.demo', password: 'nexora123' })
      if (err2) setError(err2.message)
    }
    setLoading(false)
  }

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 relative overflow-hidden" style={{ background: 'var(--nexora-bg)' }}>
      <button onClick={toggleTheme} className="absolute top-6 right-6 p-2 rounded-full hover:bg-black/5 z-50 transition-colors" style={{ color: 'var(--nexora-text)' }}>
        {theme === 'dark' ? <Sun size={24} /> : <Moon size={24} />}
      </button>
      <div className="w-full max-w-md animate-slide-up z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 shadow-lg shadow-emerald-500/30" style={{ background: 'var(--nexora-green)' }}>
            <Building2 size={32} color="white" />
          </div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--nexora-text)' }}>Nexora</h1>
          <p className="mt-1" style={{ color: 'var(--nexora-text)', opacity: 0.7 }}>Municipal Dashboard</p>
        </div>

        <div className="card shadow-xl rounded-2xl">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--nexora-text)', opacity: 0.5 }} />
              <input className="input w-full" style={{ paddingLeft: '44px' }} type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="relative">
              <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--nexora-text)', opacity: 0.5 }} />
              <input className="input pr-10 w-full" style={{ paddingLeft: '44px' }} type={showPass ? 'text' : 'password'} placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 hover:opacity-100" style={{ color: 'var(--nexora-text)', opacity: 0.5 }}>
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            
            {error && <div className="p-3 rounded-lg text-sm bg-red-500/10 text-red-500 border border-red-500/20">{error}</div>}
            
            <div className="flex gap-3 mt-4">
              <button type="submit" className="btn-primary flex-1" disabled={loading}>
                {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Sign In'}
              </button>
              <button type="button" onClick={demoLogin} disabled={loading} className="btn-primary" style={{ background: 'rgba(0,0,0,0.1)', color: 'var(--nexora-text)' }}>
                Demo Login
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
