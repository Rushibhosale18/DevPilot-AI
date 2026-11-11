import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Bug, Shield, Code2, TestTube, MessageSquare, Zap, Github, ArrowRight,
  Search, Sparkles, CheckCircle, TrendingUp, Lock, GitPullRequest
} from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'

const features = [
  {
    icon: Bug, title: 'Bug Detection', color: 'text-red-400', bg: 'bg-red-900/20 border-red-900/40',
    desc: 'Finds logic errors, null dereferences, race conditions and more with precise root-cause analysis.',
    badge: 'Most popular',
  },
  {
    icon: Shield, title: 'Security Audit', color: 'text-orange-400', bg: 'bg-orange-900/20 border-orange-900/40',
    desc: 'Full OWASP Top 10 scanner — SQL injection, XSS, hardcoded secrets, broken authentication.',
  },
  {
    icon: Code2, title: 'Code Review', color: 'text-blue-400', bg: 'bg-blue-900/20 border-blue-900/40',
    desc: 'Senior engineer review: SOLID principles, design patterns, complexity, naming quality.',
  },
  {
    icon: TestTube, title: 'Test Generation', color: 'text-green-400', bg: 'bg-green-900/20 border-green-900/40',
    desc: 'Auto-generates comprehensive pytest/jest/junit tests with mocks, edge cases, and docstrings.',
  },
  {
    icon: GitPullRequest, title: 'PR Review', color: 'text-purple-400', bg: 'bg-purple-900/20 border-purple-900/40',
    desc: 'Automatic AI review comment posted to GitHub the moment you open a pull request.',
  },
  {
    icon: MessageSquare, title: 'AI Chat', color: 'text-cyan-400', bg: 'bg-cyan-900/20 border-cyan-900/40',
    desc: 'RAG-powered conversational assistant. Ask anything about your codebase and get cited answers.',
  },
  {
    icon: Search, title: 'Code Explanation', color: 'text-yellow-400', bg: 'bg-yellow-900/20 border-yellow-900/40',
    desc: 'Plain-English breakdowns of complex logic, algorithms, execution flow and Big-O complexity.',
  },
  {
    icon: Zap, title: 'Fix Suggestions', color: 'text-pink-400', bg: 'bg-pink-900/20 border-pink-900/40',
    desc: 'Multiple ranked fix options with corrected code blocks and verification test steps.',
  },
]

const stats = [
  { value: '8', label: 'Analysis Modes' },
  { value: 'GPT-4o', label: 'AI Engine' },
  { value: 'RAG', label: 'Architecture' },
  { value: '<30s', label: 'Analysis Time' },
]

const testimonials = [
  { name: 'Found 3 critical SQL injections my team missed for weeks.', role: 'Backend Dev', emoji: '🛡️' },
  { name: 'Generated 47 unit tests for a 200-line file in 20 seconds.', role: 'Full Stack Dev', emoji: '🧪' },
  { name: 'The PR auto-review comments are incredibly detailed.', role: 'Team Lead', emoji: '🔀' },
]

const techStack = [
  'FastAPI', 'OpenAI GPT-4o', 'ChromaDB', 'React 18', 'TypeScript',
  'PyGithub', 'SQLAlchemy', 'Docker', 'GitHub Actions', 'Tailwind CSS',
]

function FadeUp({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
      viewport={{ once: true, margin: '-50px' }}
    >
      {children}
    </motion.div>
  )
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 overflow-x-hidden">
      <Navbar />

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section className="relative pt-28 sm:pt-36 pb-20 px-4 sm:px-6 overflow-hidden">
        {/* Background glow blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
          <div className="absolute -top-40 -left-40 w-80 h-80 bg-blue-600/20 rounded-full blur-3xl" />
          <div className="absolute -top-20 right-0 w-96 h-96 bg-violet-600/15 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-96 bg-gradient-radial from-blue-900/10 to-transparent" />
          {/* Grid */}
          <div className="absolute inset-0 bg-grid-pattern opacity-100" />
        </div>

        <div className="max-w-5xl mx-auto text-center relative">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-blue-950/60 border border-blue-800/50 text-blue-300 px-4 py-2 rounded-full text-xs sm:text-sm font-medium mb-6 sm:mb-8">
              <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-pulse-slow" />
              Powered by GPT-4o + RAG Architecture
              <span className="hidden sm:inline text-blue-500">•</span>
              <span className="hidden sm:inline">Final-Year Engineering Project</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl xs:text-5xl sm:text-6xl md:text-7xl font-black mb-5 sm:mb-6 leading-[1.05] tracking-tight">
              Autonomous<br />
              <span className="gradient-text">Code Intelligence</span>
            </h1>

            <p className="text-base sm:text-xl text-gray-400 max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed px-2">
              Add any GitHub repository. DevPilot AI understands it end-to-end, then detects bugs,
              audits security, generates tests, and reviews your PRs — all in under 30 seconds.
            </p>

            {/* CTAs */}
            <div className="flex flex-col xs:flex-row gap-3 justify-center px-4">
              <Link to="/register" className="btn-primary text-base px-7 py-3.5 shadow-xl shadow-blue-900/40 glow-blue group">
                Start for Free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <a href="https://github.com" className="btn-secondary text-base px-7 py-3.5">
                <Github className="w-5 h-5" /> View Source
              </a>
            </div>

            {/* Trust signals */}
            <div className="flex flex-wrap items-center justify-center gap-4 mt-8 text-xs text-gray-500">
              {['No credit card required', 'Open source', 'GitHub OAuth login'].map((t) => (
                <span key={t} className="flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-green-500" /> {t}
                </span>
              ))}
            </div>
          </motion.div>

          {/* Demo terminal */}
          <motion.div
            initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
            className="mt-14 sm:mt-16 mx-auto max-w-3xl"
          >
            <div className="card border-gray-700/50 overflow-hidden shadow-2xl shadow-black/60 glow-blue">
              {/* Terminal bar */}
              <div className="bg-gray-800/80 px-4 py-3 flex items-center gap-3 border-b border-gray-700/60">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                </div>
                <div className="flex-1 bg-gray-900/60 rounded-md px-3 py-1">
                  <span className="text-xs font-mono text-gray-500">devpilot.ai — Bug Detection — auth/middleware.py</span>
                </div>
              </div>

              {/* Terminal content */}
              <div className="p-4 sm:p-6 font-mono text-xs sm:text-sm text-left space-y-4 bg-gray-900/60">
                <div className="flex items-start gap-3">
                  <span className="text-blue-400 shrink-0 mt-0.5">●</span>
                  <div>
                    <span className="text-gray-400">Analyzed </span>
                    <span className="text-blue-300">auth/middleware.py</span>
                    <span className="text-gray-400"> — found </span>
                    <span className="text-red-400 font-bold">3 critical vulnerabilities</span>
                  </div>
                </div>
                <div className="space-y-3 pl-6">
                  {[
                    { sev: '🔴 CRITICAL', file: 'Line 42', msg: 'SQL Injection via unsanitized user input in', code: 'execute(query + user_input)', fix: 'Use parameterized queries' },
                    { sev: '🟠 HIGH', file: 'Line 78', msg: 'Timing attack in password comparison — replace with', code: 'hmac.compare_digest()', fix: 'Timing-safe comparison required' },
                    { sev: '🟡 MEDIUM', file: 'Line 103', msg: 'JWT secret defaults to empty string when', code: 'SECRET_KEY', fix: 'env var is missing — add validation' },
                  ].map((item, i) => (
                    <div key={i} className="rounded-lg bg-gray-800/60 border border-gray-700/60 p-3">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-xs">{item.sev}</span>
                        <span className="text-gray-600">·</span>
                        <span className="text-gray-400 text-xs">{item.file}</span>
                      </div>
                      <p className="text-gray-300 text-xs sm:text-sm leading-relaxed">
                        {item.msg} <code className="text-yellow-300 bg-gray-900/60 px-1 py-0.5 rounded">{item.code}</code>
                      </p>
                      <p className="text-green-400 text-xs mt-1">↳ Fix: {item.fix}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Stats ───────────────────────────────────────────────────────────── */}
      <section className="py-10 sm:py-14 border-y border-gray-800/60 bg-gray-900/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8">
            {stats.map((s, i) => (
              <FadeUp key={s.label} delay={i * 0.1}>
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-black gradient-text mb-1">{s.value}</div>
                  <div className="text-xs sm:text-sm text-gray-500">{s.label}</div>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────────────────── */}
      <section id="features" className="py-20 sm:py-28 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <FadeUp>
            <div className="text-center mb-14 sm:mb-16">
              <div className="inline-flex items-center gap-2 bg-violet-950/50 border border-violet-800/40 text-violet-300 px-3 py-1.5 rounded-full text-xs font-medium mb-4">
                <TrendingUp className="w-3.5 h-3.5" /> 8 Powerful Analysis Modes
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mb-4">
                Everything your code needs
              </h2>
              <p className="text-gray-400 text-base sm:text-lg max-w-xl mx-auto">
                One platform, eight AI-powered analysis tools — all understanding your full codebase via RAG.
              </p>
            </div>
          </FadeUp>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {features.map((f, i) => (
              <FadeUp key={f.title} delay={i * 0.05}>
                <div className={`card-hover border p-5 sm:p-6 relative overflow-hidden group h-full ${f.bg}`}>
                  {f.badge && (
                    <span className="absolute top-3 right-3 text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full font-medium">
                      {f.badge}
                    </span>
                  )}
                  <f.icon className={`w-7 h-7 ${f.color} mb-4 group-hover:scale-110 transition-transform duration-200`} />
                  <h3 className="font-bold text-white mb-2 text-sm sm:text-base">{f.title}</h3>
                  <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">{f.desc}</p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────────────────────── */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 bg-gray-900/40">
        <div className="max-w-4xl mx-auto">
          <FadeUp>
            <div className="text-center mb-14">
              <h2 className="text-3xl sm:text-4xl font-black mb-4">How it works</h2>
              <p className="text-gray-400">From GitHub URL to AI insights in three steps</p>
            </div>
          </FadeUp>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { step: '01', icon: Github, title: 'Connect your repo', desc: 'Paste any public GitHub URL. DevPilot shallow-clones and indexes every code file into a vector database.' },
              { step: '02', icon: Search, title: 'Pick an analysis', desc: 'Choose from Bug Detection, Security Audit, Code Review, Test Generation, Explain, Fix, PR Review, or Chat.' },
              { step: '03', icon: Sparkles, title: 'Get AI insights', desc: 'RAG retrieves relevant context, GPT-4o generates structured results with file references and line numbers.' },
            ].map((item, i) => (
              <FadeUp key={item.step} delay={i * 0.15}>
                <div className="relative text-center sm:text-left">
                  {/* Connector line */}
                  {i < 2 && (
                    <div className="hidden sm:block absolute top-8 left-full w-full h-px bg-gradient-to-r from-gray-700 to-transparent z-10 -translate-y-0.5" />
                  )}
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl gradient-brand mb-5 relative">
                    <item.icon className="w-6 h-6 text-white" />
                    <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gray-950 border border-gray-800 flex items-center justify-center text-xs font-black text-blue-400">
                      {i + 1}
                    </div>
                  </div>
                  <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials / Social proof ─────────────────────────────────────── */}
      <section className="py-20 sm:py-28 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <FadeUp>
            <h2 className="text-3xl sm:text-4xl font-black text-center mb-14">What developers say</h2>
          </FadeUp>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {testimonials.map((t, i) => (
              <FadeUp key={i} delay={i * 0.1}>
                <div className="card p-6 border-gray-700/60">
                  <div className="text-3xl mb-4">{t.emoji}</div>
                  <p className="text-gray-200 font-medium text-sm leading-relaxed mb-4">"{t.name}"</p>
                  <p className="text-gray-500 text-xs">{t.role}</p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── Tech Stack ──────────────────────────────────────────────────────── */}
      <section className="py-14 sm:py-16 px-4 sm:px-6 border-t border-gray-800/60 bg-gray-900/20">
        <div className="max-w-4xl mx-auto">
          <FadeUp>
            <p className="text-center text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-widest mb-7">
              Built with production-grade technology
            </p>
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
              {techStack.map((t) => (
                <span key={t} className="bg-gray-800/80 border border-gray-700/60 text-gray-400 hover:text-gray-200 hover:border-gray-500 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-mono transition-colors cursor-default">
                  {t}
                </span>
              ))}
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────────────── */}
      <section className="py-20 sm:py-28 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto text-center">
          <FadeUp>
            <div className="card border-blue-900/50 p-10 sm:p-14 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-violet-900/10 pointer-events-none" />
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-600/10 rounded-full blur-2xl pointer-events-none" />
              <Lock className="w-10 h-10 text-blue-400 mx-auto mb-5" />
              <h2 className="text-3xl sm:text-4xl font-black mb-4 relative">Debug smarter today</h2>
              <p className="text-gray-400 mb-8 leading-relaxed relative">
                Add your first repository and get a full AI analysis in under 2 minutes. Free to use.
              </p>
              <Link to="/register" className="btn-primary text-base px-8 py-4 shadow-xl shadow-blue-900/40 glow-blue group relative">
                Get Started Free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </FadeUp>
        </div>
      </section>

      <Footer />
    </div>
  )
}
