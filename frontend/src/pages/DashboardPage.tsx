import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  Plus, Trash2, RefreshCw, GitBranch, Star, ChevronRight, 
  AlertCircle, Search, ExternalLink, GitFork, CheckCircle2,
  FolderGit2, Sparkles, X, ArrowUpRight
} from 'lucide-react'
import toast from 'react-hot-toast'
import { repoApi } from '@/services/api'
import { motion, AnimatePresence } from 'framer-motion'
import { Navbar } from '@/components/layout/Navbar'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'

const statusMap: Record<string, { label: string; variant: 'warning' | 'info' | 'purple' | 'success' | 'danger'; dot: boolean }> = {
  pending: { label: 'Queued', variant: 'warning', dot: true },
  cloning: { label: 'Cloning...', variant: 'info', dot: true },
  indexing: { label: 'Indexing Vectors...', variant: 'purple', dot: true },
  ready: { label: 'Active', variant: 'success', dot: false },
  failed: { label: 'Failed', variant: 'danger', dot: false },
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [githubUrl, setGithubUrl] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [searchFilter, setSearchFilter] = useState('')

  const { data: repos = [], isLoading } = useQuery({
    queryKey: ['repos'],
    queryFn: () => repoApi.list().then((r) => r.data),
    refetchInterval: (data) =>
      Array.isArray(data) && data.some((r: any) => ['pending', 'cloning', 'indexing'].includes(r.status))
        ? 2500 : false,
  })

  const addMutation = useMutation({
    mutationFn: (url: string) => repoApi.add(url),
    onSuccess: () => { 
      qc.invalidateQueries({ queryKey: ['repos'] })
      setGithubUrl('')
      setShowAddModal(false)
      toast.success('Repository linked! Indexing started in background ⚡') 
    },
    onError: (e: any) => toast.error(e.response?.data?.detail || 'Failed to add repository'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => repoApi.delete(id),
    onSuccess: () => { 
      qc.invalidateQueries({ queryKey: ['repos'] })
      toast.success('Repository removed') 
    },
  })

  const filteredRepos = repos.filter((r: any) => 
    r.full_name?.toLowerCase().includes(searchFilter.toLowerCase()) ||
    r.language?.toLowerCase().includes(searchFilter.toLowerCase())
  )

  const quickSamples = [
    'https://github.com/pallets/flask',
    'https://github.com/tiangolo/fastapi',
    'https://github.com/expressjs/express'
  ]

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 pt-24 pb-16">
        {/* Header Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Code Intelligence Hub</h1>
              <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-900/40 text-blue-300 border border-blue-800">
                {repos.length} Repositories
              </span>
            </div>
            <p className="text-gray-400 text-sm">
              Manage your connected codebases, run multi-modal AI diagnostics, and inspect vector indexes.
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary w-full sm:w-auto text-sm py-3 px-5 shadow-lg shadow-blue-900/30 flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" /> Connect GitHub Repo
          </button>
        </div>

        {/* Search & Stats Filter bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Filter repositories by name or language..."
              className="input pl-10 py-2.5 bg-gray-900 border-gray-800 text-sm w-full"
            />
            {searchFilter && (
              <button 
                onClick={() => setSearchFilter('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 text-xs"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Repositories List */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Spinner size="lg" />
            <p className="text-gray-400 text-sm animate-pulse">Syncing repositories...</p>
          </div>
        ) : filteredRepos.length === 0 ? (
          <div className="card p-8 sm:p-14 text-center border-dashed border-gray-800 bg-gray-900/30">
            <div className="w-14 h-14 rounded-2xl bg-gray-800/80 border border-gray-700/60 flex items-center justify-center mx-auto mb-4 text-blue-400">
              <FolderGit2 className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold mb-1">
              {searchFilter ? 'No matching repositories found' : 'No connected repositories yet'}
            </h3>
            <p className="text-gray-400 text-sm max-w-md mx-auto mb-6">
              {searchFilter 
                ? `No repositories match "${searchFilter}". Try searching by another keyword.` 
                : 'Connect a public or private GitHub repository to index code into ChromaDB and start autonomous AI debugging.'}
            </p>
            {!searchFilter && (
              <button
                onClick={() => setShowAddModal(true)}
                className="btn-primary py-2.5 px-6 mx-auto"
              >
                <Plus className="w-4 h-4" /> Connect Your First Repo
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3.5">
            {filteredRepos.map((repo: any) => {
              const statusCfg = statusMap[repo.status] || { label: repo.status, variant: 'default', dot: false }
              const isWorking = ['pending', 'cloning', 'indexing'].includes(repo.status)

              return (
                <motion.div
                  key={repo.id}
                  layout
                  className="card p-4 sm:p-5 hover:border-gray-700 transition-all duration-200 bg-gray-900/80 hover:bg-gray-900 shadow-sm"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Repo Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
                        <Link 
                          to={`/repo/${repo.id}`}
                          className="font-bold text-base sm:text-lg text-white hover:text-blue-400 transition-colors flex items-center gap-1.5 truncate group"
                        >
                          <GitBranch className="w-4 h-4 text-blue-400 shrink-0" />
                          <span className="truncate">{repo.full_name}</span>
                          <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-blue-400" />
                        </Link>

                        <Badge variant={statusCfg.variant} dot={statusCfg.dot}>
                          {isWorking && <RefreshCw className="w-3 h-3 animate-spin mr-1 inline" />}
                          {statusCfg.label}
                        </Badge>

                        {repo.language && (
                          <span className="px-2 py-0.5 rounded-md text-xs font-mono bg-gray-800 text-gray-300 border border-gray-700/60">
                            {repo.language}
                          </span>
                        )}
                      </div>

                      {repo.description ? (
                        <p className="text-sm text-gray-400 line-clamp-2 sm:line-clamp-1 mb-2.5">
                          {repo.description}
                        </p>
                      ) : (
                        <p className="text-xs text-gray-500 italic mb-2.5">No description provided</p>
                      )}

                      {/* Meta counters */}
                      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400 font-mono">
                        <span className="flex items-center gap-1.5">
                          <Star className="w-3.5 h-3.5 text-yellow-500/80" />
                          {repo.stars?.toLocaleString() || 0}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                          <span>{repo.indexed_files || 0} / {repo.total_files || 0} files indexed</span>
                        </span>
                        <a
                          href={repo.github_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-gray-500 hover:text-gray-300 flex items-center gap-1 transition-colors ml-auto sm:ml-0"
                        >
                          GitHub <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>

                      {repo.error_message && (
                        <div className="mt-3 p-2.5 rounded-lg bg-red-950/40 border border-red-800/60 text-red-300 text-xs flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                          <span>{repo.error_message}</span>
                        </div>
                      )}
                    </div>

                    {/* Actions bar (Mobile responsive) */}
                    <div className="flex items-center justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-800/80">
                      {repo.status === 'ready' && (
                        <Link
                          to={`/repo/${repo.id}`}
                          className="btn-primary flex-1 sm:flex-initial py-2.5 px-4 text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5"
                        >
                          <span>Analyze Repo</span>
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      )}

                      {isWorking && (
                        <div className="flex items-center gap-2 text-xs text-blue-400 py-2 px-3 bg-blue-950/50 rounded-xl border border-blue-900/60">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span className="hidden xs:inline">Processing...</span>
                        </div>
                      )}

                      <button
                        onClick={() => {
                          if (confirm(`Remove ${repo.full_name} and wipe its indexed vectors?`)) {
                            deleteMutation.mutate(repo.id)
                          }
                        }}
                        disabled={deleteMutation.isPending}
                        className="p-2.5 text-gray-500 hover:text-red-400 hover:bg-red-950/30 rounded-xl border border-transparent hover:border-red-900/40 transition-colors"
                        title="Delete repository"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </main>

      {/* Add Repository Modal (Mobile-friendly Sheet / Dialog) */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="card w-full sm:max-w-lg bg-gray-900 border-gray-700/80 rounded-t-3xl sm:rounded-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto safe-bottom"
            >
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-white">Connect GitHub Repository</h3>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-gray-400 text-sm mb-4">
                Enter any public GitHub URL (or private repository if token is configured in your backend).
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                    GitHub URL
                  </label>
                  <input
                    type="url"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    placeholder="https://github.com/owner/repository"
                    className="input font-mono text-sm"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && githubUrl) {
                        addMutation.mutate(githubUrl)
                      }
                    }}
                  />
                </div>

                {/* Quick Samples */}
                <div>
                  <span className="text-xs text-gray-500 mb-2 block font-medium">Or try a sample project:</span>
                  <div className="flex flex-wrap gap-2">
                    {quickSamples.map((sample) => (
                      <button
                        key={sample}
                        type="button"
                        onClick={() => setGithubUrl(sample)}
                        className="text-xs font-mono bg-gray-800/80 hover:bg-gray-800 border border-gray-700 text-gray-300 px-2.5 py-1.5 rounded-lg transition-colors truncate max-w-full"
                      >
                        {sample.replace('https://github.com/', '')}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="btn-secondary w-full sm:w-1/2 py-3 text-sm order-2 sm:order-1"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => githubUrl && addMutation.mutate(githubUrl)}
                    disabled={!githubUrl || addMutation.isPending}
                    className="btn-primary w-full sm:w-1/2 py-3 text-sm order-1 sm:order-2 flex items-center justify-center gap-2"
                  >
                    {addMutation.isPending ? (
                      <>
                        <Spinner size="sm" />
                        <span>Cloning...</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        <span>Add & Index</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
