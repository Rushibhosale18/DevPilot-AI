import { Link } from 'react-router-dom'
import { Bot, Github, Twitter, Linkedin } from 'lucide-react'

const links = {
  product: [
    { label: 'Bug Detection', href: '/#features' },
    { label: 'Security Audit', href: '/#features' },
    { label: 'Code Review', href: '/#features' },
    { label: 'Test Generation', href: '/#features' },
  ],
  resources: [
    { label: 'Documentation', href: '#' },
    { label: 'API Reference', href: '/api/docs' },
    { label: 'GitHub', href: '#' },
    { label: 'Changelog', href: '#' },
  ],
}

export function Footer() {
  return (
    <footer className="border-t border-gray-800 bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-2">
            <Link to="/" className="inline-flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-xl gradient-brand flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-lg">DevPilot <span className="gradient-text">AI</span></span>
            </Link>
            <p className="text-gray-500 text-sm leading-relaxed max-w-xs">
              Autonomous code intelligence powered by GPT-4o and RAG. Debug smarter, ship faster.
            </p>
            <div className="flex items-center gap-3 mt-5">
              {[Github, Twitter, Linkedin].map((Icon, i) => (
                <a key={i} href="#" className="w-9 h-9 rounded-lg bg-gray-800 border border-gray-700 hover:border-gray-500 hover:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-white transition-all">
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Product</h4>
            <ul className="space-y-3">
              {links.product.map((l) => (
                <li key={l.label}>
                  <Link to={l.href} className="text-sm text-gray-500 hover:text-white transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Resources</h4>
            <ul className="space-y-3">
              {links.resources.map((l) => (
                <li key={l.label}>
                  <a href={l.href} className="text-sm text-gray-500 hover:text-white transition-colors">{l.label}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-600">© 2026 DevPilot AI. Built as a final-year engineering project.</p>
          <div className="flex items-center gap-1 text-xs text-gray-600">
            <span>Powered by</span>
            <span className="text-blue-400 font-medium">OpenAI GPT-4o</span>
            <span>+</span>
            <span className="text-violet-400 font-medium">ChromaDB RAG</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
