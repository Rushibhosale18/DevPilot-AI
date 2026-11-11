import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, ArrowRight, Bot, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { authApi } from '@/services/api'
import { useAuthStore } from '@/store/authStore'
import { motion } from 'framer-motion'

const perks = ['Free forever', 'Unlimited analyses', 'GitHub integration']

export default function RegisterPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [form, setForm] = useState({ email: '', username: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return }
    if (form.username.length < 3) { toast.error('Username must be at least 3 characters'); return }
    setLoading(true)
    try {
      const res = await authApi.register(form.email, form.username, form.password)
      setAuth(res.data.access_token, res.data.user)
      toast.success('Account created! Welcome to DevPilot AI 🚀')
      navigate('/dashboard')
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <div className="fixed inset-0 pointer-events-none" aria-hidden>
        <div className="absolute top-0 left-0 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 p-4 sm:p-6">
        <Link to="/" className="inline-flex items-center gap-2.5 font-bold text-lg">
          <div className="w-8 h-8 rounded-xl gradient-brand flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
          DevPilot <span className="gradient-text">AI</span>
        </Link>
      </div>

      <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm"
        >
          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl font-black mb-2">Create your account</h1>
            <p className="text-gray-400 text-sm">Start analyzing code with AI in minutes</p>
            {/* Perks */}
            <div className="flex items-center justify-center gap-3 mt-4 flex-wrap">
              {perks.map((p) => (
                <span key={p} className="flex items-center gap-1 text-xs text-green-400">
                  <CheckCircle className="w-3.5 h-3.5" /> {p}
                </span>
              ))}
            </div>
          </div>

          <div className="card p-6 sm:p-8 border-gray-700/60">
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">Email</label>
                <input name="email" type="email" required value={form.email} onChange={handleChange}
                  className="input" placeholder="you@example.com" autoComplete="email"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">Username</label>
                <input name="username" type="text" required value={form.username} onChange={handleChange}
                  className="input" placeholder="yourname" autoComplete="username" minLength={3}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">Password</label>
                <div className="relative">
                  <input name="password" type={showPass ? 'text' : 'password'} required value={form.password}
                    onChange={handleChange} className="input pr-11" placeholder="Min. 6 characters"
                    autoComplete="new-password" minLength={6}
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 p-1 transition-colors"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading} className="w-full btn-primary py-3.5 text-base mt-1 group">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating account...
                  </span>
                ) : (
                  <>Create Account <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" /></>
                )}
              </button>
            </form>

            <p className="text-xs text-gray-600 text-center mt-4">
              By signing up you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
              Sign in →
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
