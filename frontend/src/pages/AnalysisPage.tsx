import { useState, useEffect } from 'react'
import { Link, useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { 
  ArrowLeft, Bot, Bug, Shield, Code2, TestTube, Lightbulb, 
  GitPullRequest, AlertTriangle, CheckCircle, Info, Copy, Check,
  RefreshCw, ChevronDown, ChevronUp, FileCode, Zap, Sparkles
} from 'lucide-react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { analysisApi } from '@/services/api'
import { Navbar } from '@/components/layout/Navbar'
import { Spinner } from '@/components/ui/Spinner'
import { Badge } from '@/components/ui/Badge'
import toast from 'react-hot-toast'

const severityConfig: Record<string, { bg: string; border: string; text: string; badge: 'danger' | 'warning' | 'info' | 'default' }> = {
  critical: { bg: 'bg-red-950/30', border: 'border-red-800/60', text: 'text-red-300', badge: 'danger' },
  high: { bg: 'bg-orange-950/30', border: 'border-orange-800/60', text: 'text-orange-300', badge: 'warning' },
  medium: { bg: 'bg-yellow-950/30', border: 'border-yellow-800/60', text: 'text-yellow-300', badge: 'warning' },
  low: { bg: 'bg-blue-950/30', border: 'border-blue-800/60', text: 'text-blue-300', badge: 'info' },
  info: { bg: 'bg-gray-900', border: 'border-gray-800', text: 'text-gray-300', badge: 'default' },
}

const typeIcons: Record<string, any> = {
  bugs: Bug, 
  security: Shield, 
  review: Code2, 
  tests: TestTube, 
  explain: Lightbulb, 
  pr: GitPullRequest,
}

function CodeBlockWithCopy({ code, language = 'python' }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    toast.success('Code copied to clipboard!')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative group rounded-xl overflow-hidden border border-gray-800 my-2">
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-gray-800/90 border-b border-gray-700/60 text-xs font-mono text-gray-400">
        <span>{language}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-gray-400 hover:text-white px-2 py-0.5 rounded transition-colors"
          title="Copy to clipboard"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span className="text-[11px]">{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      <div className="overflow-x-auto text-xs">
        <SyntaxHighlighter
          language={language}
          style={vscDarkPlus}
          customStyle={{ margin: 0, padding: '1rem', background: '#0d1117' }}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  )
}

function BugCard({ bug, index }: { bug: any; index: number }) {
  const [isOpen, setIsOpen] = useState(true)
  const sevKey = (bug.severity || 'info').toLowerCase()
  const cfg = severityConfig[sevKey] || severityConfig.info

  return (
    <div className={`border rounded-2xl p-4 sm:p-5 transition-all ${cfg.bg} ${cfg.border}`}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-start justify-between gap-3 cursor-pointer select-none"
      >
        <div className="flex items-start gap-2.5 min-w-0">
          <Badge variant={cfg.badge} size="sm" className="uppercase font-bold tracking-wider mt-0.5 shrink-0">
            {bug.severity || 'Info'}
          </Badge>
          <div className="min-w-0">
            <h4 className="font-bold text-sm sm:text-base text-white leading-snug">
              {bug.description || bug.title || `Issue #${index + 1}`}
            </h4>
            <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-gray-400 font-mono">
              {bug.line_range && <span>Lines {bug.line_range}</span>}
              {bug.type && <span>• {bug.type}</span>}
              {bug.cve_type && <span>• {bug.cve_type}</span>}
            </div>
          </div>
        </div>
        <button className="text-gray-400 hover:text-white p-1 shrink-0">
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {isOpen && (
        <div className="mt-4 pt-3 border-t border-gray-800/80 space-y-3 text-xs sm:text-sm">
          {bug.root_cause && (
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-1">
                Root Cause
              </span>
              <p className="text-gray-300 leading-relaxed bg-gray-950/50 p-3 rounded-xl border border-gray-800/60">
                {bug.root_cause}
              </p>
            </div>
          )}

          {bug.attack_scenario && (
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-red-400 block mb-1">
                Exploitation Scenario
              </span>
              <p className="text-gray-300 leading-relaxed bg-red-950/20 p-3 rounded-xl border border-red-900/40">
                {bug.attack_scenario}
              </p>
            </div>
          )}

          {(bug.fix || bug.remediation) && (
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-green-400 block mb-1">
                Recommended Solution
              </span>
              {typeof (bug.fix || bug.remediation) === 'string' && (bug.fix || bug.remediation).includes('\n') ? (
                <CodeBlockWithCopy code={bug.fix || bug.remediation} />
              ) : (
                <p className="text-gray-200 bg-gray-950/50 p-3 rounded-xl border border-gray-800/60">
                  {bug.fix || bug.remediation}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ReviewView({ review }: { review: any }) {
  return (
    <div className="space-y-6">
      {/* Score Header */}
      <div className="card p-5 sm:p-6 bg-gradient-to-r from-blue-950/30 to-violet-950/30 border-blue-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl gradient-brand flex items-center justify-center text-2xl font-black text-white shrink-0">
            {review.overall_score || 8}
            <span className="text-xs font-normal text-blue-200">/10</span>
          </div>
          <div>
            <h3 className="font-bold text-base sm:text-lg text-white">Engineering Quality Score</h3>
            <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">{review.summary}</p>
          </div>
        </div>
      </div>

      {/* Strengths */}
      {review.strengths?.length > 0 && (
        <div className="card p-5 border-green-900/40 bg-green-950/15">
          <h4 className="font-bold text-sm text-green-300 uppercase tracking-wider mb-3 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-400" /> Architectural Strengths
          </h4>
          <ul className="space-y-2 text-xs sm:text-sm text-gray-300">
            {review.strengths.map((s: string, i: number) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-green-400 font-bold">•</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Review Issues */}
      {review.issues?.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-bold text-sm text-gray-300 uppercase tracking-wider">
            Detected Code Smells & Refactoring Targets ({review.issues.length})
          </h4>
          {review.issues.map((issue: any, i: number) => (
            <BugCard key={i} bug={issue} index={i} />
          ))}
        </div>
      )}
    </div>
  )
}

function TestGenView({ tests }: { tests: any }) {
  return (
    <div className="space-y-5">
      <div className="card p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 bg-gray-900 border-gray-800">
        <div className="flex items-center gap-3">
          <Badge variant="success" size="md">
            {tests.framework || 'pytest'}
          </Badge>
          <span className="text-xs sm:text-sm text-gray-300">
            Generated <strong className="text-green-400">{tests.total_tests || 'Full Suite'}</strong> unit test cases
          </span>
        </div>
        {tests.test_file_path && (
          <span className="text-xs font-mono text-gray-400 bg-gray-950 px-2.5 py-1 rounded-lg border border-gray-800">
            {tests.test_file_path}
          </span>
        )}
      </div>

      {tests.coverage_areas?.length > 0 && (
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-2">
            Coverage Targets
          </span>
          <div className="flex flex-wrap gap-2">
            {tests.coverage_areas.map((area: string, i: number) => (
              <span key={i} className="text-xs bg-gray-800 border border-gray-700 text-gray-300 px-2.5 py-1 rounded-lg">
                ✓ {area}
              </span>
            ))}
          </div>
        </div>
      )}

      {tests.test_code && (
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-2">
            Automated Test Suite
          </span>
          <CodeBlockWithCopy code={tests.test_code} language="python" />
        </div>
      )}
    </div>
  )
}

function ExplanationView({ explanation }: { explanation: any }) {
  return (
    <div className="space-y-6">
      <div className="card p-5 sm:p-6 bg-gray-900 border-gray-800">
        <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400 mb-2">
          High-Level Purpose
        </h3>
        <p className="text-gray-200 text-sm sm:text-base leading-relaxed">
          {explanation.purpose || explanation.summary}
        </p>
      </div>

      {explanation.key_concepts?.length > 0 && (
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
            Key Concepts & Patterns
          </h4>
          <div className="flex flex-wrap gap-2">
            {explanation.key_concepts.map((concept: string, i: number) => (
              <Badge key={i} variant="purple" size="md">
                {concept}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {explanation.execution_flow?.length > 0 && (
        <div className="card p-5 border-gray-800 bg-gray-900">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">
            Execution Flow Sequence
          </h4>
          <div className="space-y-3">
            {explanation.execution_flow.map((step: string, i: number) => (
              <div key={i} className="flex items-start gap-3 text-xs sm:text-sm">
                <span className="w-6 h-6 rounded-lg gradient-brand text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <span className="text-gray-300 leading-relaxed pt-0.5">{step}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {explanation.complexity && (
        <div className="grid grid-cols-2 gap-3">
          <div className="card p-4 text-center border-gray-800 bg-gray-900/80">
            <span className="text-xs text-gray-400 block mb-1">Time Complexity</span>
            <span className="font-mono text-base font-bold text-yellow-400">
              {explanation.complexity.time || 'O(N)'}
            </span>
          </div>
          <div className="card p-4 text-center border-gray-800 bg-gray-900/80">
            <span className="text-xs text-gray-400 block mb-1">Space Complexity</span>
            <span className="font-mono text-base font-bold text-cyan-400">
              {explanation.complexity.space || 'O(1)'}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

export default function AnalysisPage() {
  const { repoId } = useParams<{ repoId: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const id = Number(repoId)
  
  const type = searchParams.get('type') || 'bugs'
  const filePath = searchParams.get('file') || ''
  const [prNumber, setPrNumber] = useState('')
  const [result, setResult] = useState<any>(null)
  
  const TypeIcon = typeIcons[type] || Bug

  const titles: Record<string, string> = {
    bugs: 'Autonomous Bug Detection',
    security: 'OWASP Security Audit',
    review: 'Senior Engineer Code Review',
    tests: 'Unit Test Generation',
    explain: 'Code Explanation & Complexity',
    pr: 'Pull Request Reviewer',
  }

  const apiMap: Record<string, () => Promise<any>> = {
    bugs: () => analysisApi.bugs(id, filePath).then(r => r.data.bugs),
    security: () => analysisApi.security(id, filePath).then(r => r.data.vulnerabilities),
    review: () => analysisApi.review(id, filePath).then(r => r.data.review),
    tests: () => analysisApi.tests(id, filePath).then(r => r.data.tests),
    explain: () => analysisApi.explain(id, filePath).then(r => r.data.explanation),
    pr: () => analysisApi.prReview(id, Number(prNumber)).then(r => r.data.review),
  }

  const mutation = useMutation({
    mutationFn: () => apiMap[type]?.(),
    onSuccess: (data) => setResult(data),
    onError: (e: any) => toast.error(e.response?.data?.detail || 'Analysis query failed'),
  })

  useEffect(() => {
    if (type !== 'pr' && filePath) {
      mutation.mutate()
    }
  }, [type, filePath])

  const renderContent = () => {
    if (!result) return null

    if (type === 'bugs' || type === 'security') {
      const list = Array.isArray(result) ? result : result.vulnerabilities || []
      if (list.length === 0) {
        return (
          <div className="card p-10 text-center border-green-900/40 bg-green-950/20">
            <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white mb-1">Clean Bill of Health!</h3>
            <p className="text-sm text-gray-400">DevPilot AI found zero security flaws or bugs in this file.</p>
          </div>
        )
      }
      return (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
            <span>Detected {list.length} finding{list.length !== 1 ? 's' : ''}</span>
            <span>Sorted by Severity</span>
          </div>
          {list.map((item: any, i: number) => (
            <BugCard key={i} bug={item} index={i} />
          ))}
        </div>
      )
    }

    if (type === 'review') return <ReviewView review={result} />
    if (type === 'tests') return <TestGenView tests={result} />
    if (type === 'explain') return <ExplanationView explanation={result} />
    if (type === 'pr') {
      return (
        <div className="card p-6 border-gray-800 bg-gray-900 prose prose-invert max-w-none text-xs sm:text-sm">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {result.pr_comment_markdown || JSON.stringify(result, null, 2)}
          </ReactMarkdown>
        </div>
      )
    }

    return (
      <div className="card p-4 overflow-x-auto text-xs font-mono text-gray-300">
        <pre>{JSON.stringify(result, null, 2)}</pre>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      <Navbar showDashboardLink />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 pt-24 pb-20">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between gap-3 mb-6">
          <Link
            to={`/repo/${id}`}
            className="btn-secondary text-xs py-2 px-3 flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Repo
          </Link>

          {result && !mutation.isPending && (
            <button
              onClick={() => mutation.mutate()}
              className="btn-ghost text-xs flex items-center gap-1.5 text-blue-400"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Re-run
            </button>
          )}
        </div>

        {/* Header Title Card */}
        <div className="card p-5 sm:p-6 mb-6 bg-gray-900 border-gray-800">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center shrink-0">
              <TypeIcon className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl font-black text-white">{titles[type] || 'Analysis'}</h1>
              {filePath && (
                <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-400 font-mono truncate">
                  <FileCode className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span className="truncate">{filePath}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* PR Selector Form (If PR review mode) */}
        {type === 'pr' && !result && (
          <div className="card p-6 border-gray-800 bg-gray-900 mb-6">
            <h3 className="font-bold text-sm text-white mb-2">Pull Request Number</h3>
            <p className="text-xs text-gray-400 mb-4">
              Enter an open or closed PR number on this repository to review diffs and calculate impact.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="number"
                value={prNumber}
                onChange={(e) => setPrNumber(e.target.value)}
                placeholder="e.g. 1"
                min="1"
                className="input font-mono text-sm flex-1"
              />
              <button
                onClick={() => prNumber && mutation.mutate()}
                disabled={!prNumber || mutation.isPending}
                className="btn-primary py-3 px-6 text-sm flex items-center justify-center gap-2"
              >
                {mutation.isPending ? <Spinner size="sm" /> : <GitPullRequest className="w-4 h-4" />}
                <span>Fetch Diff & Review</span>
              </button>
            </div>
          </div>
        )}

        {/* Loading Spinner View */}
        {mutation.isPending && (
          <div className="card p-12 sm:p-16 border-gray-800 bg-gray-900/60 text-center flex flex-col items-center justify-center gap-4">
            <div className="relative">
              <Spinner size="lg" />
              <div className="w-6 h-6 rounded-full gradient-brand absolute inset-0 m-auto flex items-center justify-center">
                <Sparkles className="w-3 h-3 text-white animate-spin" />
              </div>
            </div>
            <div>
              <h3 className="font-bold text-base text-white">DevPilot AI is processing...</h3>
              <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                Running semantic RAG query, evaluating code against OWASP / clean code heuristics, and generating structured verification.
              </p>
            </div>
          </div>
        )}

        {/* Results Container */}
        {result && !mutation.isPending && renderContent()}
      </main>
    </div>
  )
}
