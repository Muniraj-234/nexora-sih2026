import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Truck, Mail, Lock, Eye, EyeOff } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const demoLogin = async () => {
    setLoading(true)
    setError('')
    const { error: err } = await supabase.auth.signInWithPassword({
      email: 'collector@nexora.demo',
      password: 'nexora123'
    })
    if (err) {
      const { data: signupData } = await supabase.auth.signUp({ email: 'collector@nexora.demo', password: 'nexora123' })
      if (signupData?.user) {
        await supabase.from('users').upsert({
          id: signupData.user.id,
          role: 'collector',
          name: 'Demo Collector',
          phone: '9876543211',
        })
      }
      const { error: err2 } = await supabase.auth.signInWithPassword({
        email: 'collector@nexora.demo', password: 'nexora123'
      })
      if (err2) setError(err2.message)
    }
    setLoading(false)
  }

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      if (email === 'collector@nexora.demo' && error.message.includes('Invalid login credentials')) {
        await demoLogin()
        return
      }
      setError(error.message)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 bg-slate-50 relative overflow-hidden">
      <div className="w-full max-w-md animate-slide-up z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 bg-emerald-500 shadow-lg shadow-emerald-500/30">
            <Truck size={32} color="white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800">Nexora</h1>
          <p className="text-slate-500 mt-1">Collector Portal</p>
        </div>

        <div className="card shadow-xl shadow-slate-200/50 border-white bg-white p-6 md:p-8 rounded-2xl">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input className="input w-full bg-slate-50" style={{ paddingLeft: '44px' }} type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="relative">
              <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input className="input pr-10 w-full bg-slate-50" style={{ paddingLeft: '44px' }} type={showPass ? 'text' : 'password'} placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            
            {error && <div className="p-3 rounded-lg text-sm bg-red-50 text-red-600 border border-red-100">{error}</div>}
            
            <button type="submit" className="btn-primary w-full mt-2" disabled={loading}>
              {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 p-4 rounded-xl bg-emerald-50 border border-emerald-100">
            <p className="text-xs text-emerald-700 font-semibold mb-2">🚛 Demo Collector Login</p>
            <p className="text-xs text-emerald-600/80 mb-2">Use demo seeded collector account:</p>
            <p className="text-xs text-emerald-800 font-medium">Email: collector@nexora.demo</p>
            <p className="text-xs text-emerald-800 font-medium">Password: nexora123</p>
            <button onClick={demoLogin} disabled={loading} className="mt-3 w-full text-xs px-4 py-2 rounded-lg font-semibold bg-white text-emerald-600 border border-emerald-200 hover:bg-emerald-100 transition-colors shadow-sm">
              Quick Demo Login
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
