import { useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { 
  Bot, ChevronRight, Bug, Shield, Code2, TestTube, Lightbulb, 
  MessageSquare, GitPullRequest, ArrowLeft, FileCode, Search,
  CheckCircle2, FolderTree, Sparkles, Star, GitBranch, ArrowUpRight
} from 'lucide-react'
import { repoApi } from '@/services/api'
import { Navbar } from '@/components/layout/Navbar'
import { Spinner } from '@/components/ui/Spinner'
import { Badge } from '@/components/ui/Badge'
import { motion } from 'framer-motion'

const analysisOptions = [
  { 
    id: 'bugs', 
    label: 'Autonomous Bug Detection', 
    shortLabel: 'Bugs',
    icon: Bug, 
    color: 'text-red-400', 
    bg: 'border-red-900/40 hover:border-red-700/60 bg-red-950/20',
    desc: 'Uncovers race conditions, off-by-one errors, memory leaks, and logic faults with exact fixes.' 
  },
  { 
    id: 'security', 
    label: 'OWASP Security Audit', 
    shortLabel: 'Security',
    icon: Shield, 
    color: 'text-orange-400', 
    bg: 'border-orange-900/40 hover:border-orange-700/60 bg-orange-950/20',
    desc: 'Deep security scan covering injection risks, credential leaks, CSRF, and broken access controls.' 
  },
  { 
    id: 'review', 
    label: 'Senior Code Review', 
    shortLabel: 'Review',
    icon: Code2, 
    color: 'text-blue-400', 
    bg: 'border-blue-900/40 hover:border-blue-700/60 bg-blue-950/20',
    desc: 'Architectural breakdown evaluating DRY/SOLID adherence, readability, and design patterns.' 
  },
  { 
    id: 'tests', 
    label: 'Unit Test Generator', 
    shortLabel: 'Tests',
    icon: TestTube, 
    color: 'text-green-400', 
    bg: 'border-green-900/40 hover:border-green-700/60 bg-green-950/20',
    desc: 'Auto-generates unit tests with edge conditions, mocks, assertions, and execution instructions.' 
  },
  { 
    id: 'explain', 
    label: 'Code Explanation & Flow', 
    shortLabel: 'Explain',
    icon: Lightbulb, 
    color: 'text-yellow-400', 
    bg: 'border-yellow-900/40 hover:border-yellow-700/60 bg-yellow-950/20',
    desc: 'Translates convoluted routines into step-by-step logic, data flows, and Big-O computational bounds.' 
  },
  { 
    id: 'chat', 
    label: 'RAG Codebase Chat', 
    shortLabel: 'Chat',
    icon: MessageSquare, 
    color: 'text-cyan-400', 
    bg: 'border-cyan-900/40 hover:border-cyan-700/60 bg-cyan-950/20',
    desc: 'Chat directly with your repository vectors. Ask architecture questions or locate routines.',
    noFile: true 
  },
  { 
    id: 'pr', 
    label: 'Automated PR Inspector', 
    shortLabel: 'PR Review',
    icon: GitPullRequest, 
    color: 'text-purple-400', 
    bg: 'border-purple-900/40 hover:border-purple-700/60 bg-purple-950/20',
    desc: 'Inspects a GitHub pull request diff and drafts structured review comments.',
    noFile: true 
  },
]

export default function RepositoryPage() {
  const { repoId } = useParams<{ repoId: string }>()
  const navigate = useNavigate()
  const id = Number(repoId)

  const [selectedFile, setSelectedFile] = useState('')
  const [fileSearch, setFileSearch] = useState('')
  const [mobileTab, setMobileTab] = useState<'files' | 'tools'>('files')

  const { data: repo, isLoading: repoLoading } = useQuery({ 
    queryKey: ['repo', id], 
    queryFn: () => repoApi.get(id).then(r => r.data) 
  })
  
  const { data: files = [], isLoading: filesLoading } = useQuery({ 
    queryKey: ['files', id], 
    queryFn: () => repoApi.listFiles(id).then(r => r.data) 
  })

  const filteredFiles = (files as any[]).filter((f: any) =>
    f.path.toLowerCase().includes(fileSearch.toLowerCase())
  )

  const handleLaunch = (toolId: string) => {
    if (toolId === 'chat') { 
      navigate(`/repo/${id}/chat`)
      return 
    }
    if (toolId === 'pr') { 
      navigate(`/repo/${id}/analyze?type=pr`)
      return 
    }
    if (!selectedFile) {
      setMobileTab('files')
      return
    }
    navigate(`/repo/${id}/analyze?type=${toolId}&file=${encodeURIComponent(selectedFile)}`)
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      <Navbar repoName={repo?.full_name} showDashboardLink />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-24 pb-20">
        {/* Repo Header Card */}
        <div className="card p-5 sm:p-6 mb-6 bg-gradient-to-r from-gray-900 via-gray-900 to-gray-900/80 border-gray-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <Link to="/dashboard" className="text-gray-400 hover:text-white transition-colors text-xs flex items-center gap-1 sm:hidden">
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
                </Link>
              </div>
              <h1 className="text-xl sm:text-2xl font-black flex items-center gap-2">
                <GitBranch className="w-5 h-5 text-blue-400 shrink-0" />
                <span className="truncate">{repo?.full_name || 'Loading repository...'}</span>
              </h1>
              <p className="text-xs sm:text-sm text-gray-400 mt-1 max-w-2xl line-clamp-2">
                {repo?.description || 'Repository connected and indexed with ChromaDB vectors.'}
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <Link
                to={`/repo/${id}/chat`}
                className="btn-primary text-xs sm:text-sm py-2.5 px-4 flex items-center gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Ask AI Chat</span>
              </Link>
            </div>
          </div>

          {/* Repo specs pill bar */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-6 mt-4 pt-4 border-t border-gray-800/80 text-xs text-gray-400 font-mono">
            <span className="flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 text-yellow-500" />
              <span>{repo?.stars?.toLocaleString() || 0} stars</span>
            </span>
            <span className="flex items-center gap-1.5">
              <FolderTree className="w-3.5 h-3.5 text-blue-400" />
              <span>{files.length} indexed code files</span>
            </span>
            {repo?.language && (
              <span className="flex items-center gap-1.5 text-purple-300">
                <FileCode className="w-3.5 h-3.5" />
                <span>Primary: {repo.language}</span>
              </span>
            )}
          </div>
        </div>

        {/* Mobile Tab Switcher */}
        <div className="flex lg:hidden rounded-xl bg-gray-900 border border-gray-800 p-1 mb-5">
          <button
            onClick={() => setMobileTab('files')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all ${
              mobileTab === 'files' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'
            }`}
          >
            <FolderTree className="w-3.5 h-3.5" />
            <span>Files ({files.length})</span>
            {selectedFile && <span className="w-2 h-2 rounded-full bg-green-400" />}
          </button>
          <button
            onClick={() => setMobileTab('tools')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all ${
              mobileTab === 'tools' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Diagnostic Tools</span>
          </button>
        </div>

        {/* Main Work Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* File Explorer (Col 1 to 5) */}
          <div className={`lg:col-span-5 ${mobileTab === 'files' ? 'block' : 'hidden lg:block'}`}>
            <div className="card p-4 sm:p-5 border-gray-800 bg-gray-900/90 sticky top-20">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                  <FolderTree className="w-4 h-4 text-blue-400" /> Source Files
                </h2>
                <span className="text-xs text-gray-500 font-mono">
                  {filteredFiles.length} of {files.length}
                </span>
              </div>

              {/* File Search */}
              <div className="relative mb-3">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  value={fileSearch}
                  onChange={(e) => setFileSearch(e.target.value)}
                  placeholder="Search file path..."
                  className="input pl-8 py-2 text-xs bg-gray-950 border-gray-800"
                />
              </div>

              {/* Files Scroll List */}
              {filesLoading ? (
                <div className="flex items-center justify-center py-16 gap-2 text-sm text-gray-500">
                  <Spinner size="sm" /> Loading files...
                </div>
              ) : filteredFiles.length === 0 ? (
                <div className="p-8 text-center text-xs text-gray-500">
                  No files match your query
                </div>
              ) : (
                <div className="max-h-[50vh] lg:max-h-[520px] overflow-y-auto scrollbar-thin divide-y divide-gray-800/50 pr-1">
                  {filteredFiles.map((f: any) => {
                    const isSelected = selectedFile === f.path

                    return (
                      <button
                        key={f.path}
                        onClick={() => {
                          setSelectedFile(f.path)
                          // On mobile, auto jump to tools after selection for seamless UX
                          if (window.innerWidth < 1024) {
                            setMobileTab('tools')
                          }
                        }}
                        className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-mono transition-all flex items-center justify-between group ${
                          isSelected
                            ? 'bg-blue-600/20 text-blue-300 border border-blue-500/40 font-semibold'
                            : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <FileCode className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-blue-400' : 'text-gray-500'}`} />
                          <span className="truncate">{f.path}</span>
                        </div>
                        <span className="text-[10px] text-gray-500 font-mono ml-2 shrink-0">
                          {f.lines}L
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Selection Summary Pill */}
              {selectedFile && (
                <div className="mt-4 p-3 rounded-xl bg-blue-950/40 border border-blue-800/60 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase font-bold text-blue-400 tracking-wider block">Selected Target</span>
                    <span className="text-xs text-blue-200 font-mono truncate block">{selectedFile}</span>
                  </div>
                  <button
                    onClick={() => setSelectedFile('')}
                    className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded bg-gray-800 shrink-0"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* AI Tools Grid (Col 6 to 12) */}
          <div className={`lg:col-span-7 ${mobileTab === 'tools' ? 'block' : 'hidden lg:block'}`}>
            <div className="card p-5 sm:p-6 border-gray-800 bg-gray-900/90">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-blue-400" />
                    AI Diagnostics & Intelligence
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Select an operation below to execute multi-step LLM analysis.
                  </p>
                </div>
              </div>

              {!selectedFile && (
                <div className="mb-4 p-3.5 rounded-xl bg-yellow-950/30 border border-yellow-800/40 flex items-start gap-2.5 text-xs text-yellow-300">
                  <span className="text-base leading-none">💡</span>
                  <span>
                    Select a target file from the list to unlock file-level analysis (Bug Detection, Security Audit, Unit Tests). Codebase Chat and PR review work without file selection.
                  </span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {analysisOptions.map((opt) => {
                  const isDisabled = !opt.noFile && !selectedFile

                  return (
                    <button
                      key={opt.id}
                      onClick={() => handleLaunch(opt.id)}
                      disabled={isDisabled}
                      className={`card p-4 sm:p-5 text-left border transition-all duration-200 flex flex-col justify-between group ${
                        opt.bg
                      } ${isDisabled ? 'opacity-40 cursor-not-allowed border-gray-800 bg-gray-900/30' : 'hover:scale-[1.01] active:scale-[0.99] cursor-pointer'}`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <div className={`p-2 rounded-xl bg-gray-900/80 border border-gray-800 ${opt.color}`}>
                            <opt.icon className="w-5 h-5" />
                          </div>
                          {!isDisabled && (
                            <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                          )}
                        </div>
                        <h3 className="font-bold text-sm sm:text-base text-white mb-1.5 flex items-center gap-1.5">
                          <span>{opt.label}</span>
                        </h3>
                        <p className="text-xs text-gray-400 leading-relaxed mb-4">
                          {opt.desc}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-gray-800/60 flex items-center justify-between text-[11px] font-medium">
                        {isDisabled ? (
                          <span className="text-gray-500 italic">Target file required</span>
                        ) : (
                          <span className="text-blue-400 group-hover:underline flex items-center gap-1">
                            Run Analysis <ArrowUpRight className="w-3 h-3" />
                          </span>
                        )}
                        {opt.noFile && (
                          <span className="text-gray-500 bg-gray-800 px-2 py-0.5 rounded text-[10px]">
                            Repo-wide
                          </span>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
