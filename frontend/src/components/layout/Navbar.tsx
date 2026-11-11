import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Bot, Menu, X, LogOut, LayoutDashboard, Github, ChevronRight } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

interface NavbarProps {
  showDashboardLink?: boolean
  repoName?: string
}

export function Navbar({ showDashboardLink, repoName }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close menu on route change
  useEffect(() => { setMenuOpen(false) }, [location.pathname])

  // Prevent scroll when menu open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  const handleLogout = () => { logout(); navigate('/') }

  return (
    <>
      <header className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300 safe-top',
        scrolled ? 'glass shadow-lg shadow-black/20' : 'bg-transparent'
      )}>
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link to={user ? '/dashboard' : '/'} className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-xl gradient-brand flex items-center justify-center glow-blue">
              <Bot className="w-4.5 h-4.5 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-base sm:text-lg tracking-tight">
              DevPilot <span className="gradient-text">AI</span>
            </span>
          </Link>

          {/* Breadcrumb (desktop) */}
          {repoName && (
            <div className="hidden sm:flex items-center gap-1.5 text-sm text-gray-500 min-w-0 flex-1 mx-4">
              <Link to="/dashboard" className="hover:text-white transition-colors truncate">Dashboard</Link>
              <ChevronRight className="w-3.5 h-3.5 shrink-0" />
              <span className="text-gray-300 truncate">{repoName}</span>
            </div>
          )}

          {/* Desktop Nav */}
          <div className="hidden sm:flex items-center gap-2">
            {user ? (
              <>
                {showDashboardLink && (
                  <Link to="/dashboard" className="btn-ghost text-sm">
                    <LayoutDashboard className="w-4 h-4" /> Dashboard
                  </Link>
                )}
                <div className="flex items-center gap-3 pl-2 border-l border-gray-800">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} className="w-8 h-8 rounded-full ring-2 ring-gray-700" alt={user.username} />
                  ) : (
                    <div className="w-8 h-8 rounded-full gradient-brand flex items-center justify-center text-xs font-bold">
                      {user.username[0].toUpperCase()}
                    </div>
                  )}
                  <span className="text-sm text-gray-400 font-medium">{user.username}</span>
                  <button onClick={handleLogout} className="btn-ghost text-red-400 hover:text-red-300 hover:bg-red-900/20">
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-ghost">Sign in</Link>
                <Link to="/register" className="btn-primary">Get Started</Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="sm:hidden p-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </nav>
      </header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm sm:hidden"
              onClick={() => setMenuOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 z-50 w-72 bg-gray-900 border-l border-gray-800 flex flex-col sm:hidden safe-top safe-bottom"
            >
              {/* Drawer header */}
              <div className="flex items-center justify-between p-5 border-b border-gray-800">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg gradient-brand flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-bold">DevPilot AI</span>
                </div>
                <button onClick={() => setMenuOpen(false)} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* User info */}
              {user && (
                <div className="p-5 border-b border-gray-800">
                  <div className="flex items-center gap-3">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} className="w-10 h-10 rounded-full ring-2 ring-gray-700" alt={user.username} />
                    ) : (
                      <div className="w-10 h-10 rounded-full gradient-brand flex items-center justify-center font-bold">
                        {user.username[0].toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-sm">{user.username}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Nav links */}
              <nav className="flex-1 p-4 space-y-1">
                {user ? (
                  <>
                    <Link to="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:text-white hover:bg-gray-800 transition-colors font-medium">
                      <LayoutDashboard className="w-5 h-5 text-blue-400" /> Dashboard
                    </Link>
                    {repoName && (
                      <div className="px-4 py-3 rounded-xl bg-gray-800/50">
                        <p className="text-xs text-gray-500 mb-1">Current Repo</p>
                        <p className="text-sm text-gray-200 font-mono truncate">{repoName}</p>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <Link to="/login" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:text-white hover:bg-gray-800 transition-colors font-medium">
                      Sign In
                    </Link>
                    <Link to="/register" className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl gradient-brand text-white font-semibold mt-2">
                      Get Started Free <ChevronRight className="w-4 h-4" />
                    </Link>
                  </>
                )}
              </nav>

              {/* Bottom actions */}
              {user && (
                <div className="p-4 border-t border-gray-800">
                  <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-900/20 transition-colors font-medium">
                    <LogOut className="w-5 h-5" /> Sign Out
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
