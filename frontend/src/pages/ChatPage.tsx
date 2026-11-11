import { useState, useRef, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { 
  Bot, ArrowLeft, Send, User, Sparkles, Copy, Check, 
  Terminal, RefreshCw, Eraser
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { analysisApi, repoApi } from '@/services/api'
import { Navbar } from '@/components/layout/Navbar'
import { Spinner } from '@/components/ui/Spinner'
import toast from 'react-hot-toast'

interface Message {
  id: number
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

const suggestions = [
  'What is the core architecture and main entry point?',
  'Are there any obvious security vulnerabilities?',
  'Explain the data flow from request to database',
  'Which modules have high complexity or missing tests?',
  'Generate an overview of public APIs exposed here',
]

function ChatCodeBlock({ code, language = 'text' }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    toast.success('Snippet copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative group rounded-xl overflow-hidden border border-gray-800 my-2.5 max-w-[82vw] sm:max-w-none">
      <div className="flex items-center justify-between px-3 py-1 bg-gray-800/90 text-[11px] font-mono text-gray-400">
        <span>{language}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-gray-400 hover:text-white px-1.5 py-0.5 rounded transition-colors"
        >
          {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
          <span className="text-[10px]">{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      <div className="overflow-x-auto scrollbar-thin text-xs">
        <SyntaxHighlighter
          language={language}
          style={vscDarkPlus}
          customStyle={{ margin: 0, padding: '0.85rem', background: '#0d1117' }}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  )
}

export default function ChatPage() {
  const { repoId } = useParams<{ repoId: string }>()
  const id = Number(repoId)

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 0,
      role: 'assistant',
      content: "👋 **DevPilot AI Code Intelligence Engine is ready.**\n\nI have indexed this repository into ChromaDB vectors. You can ask me about:\n- Architectural patterns and system flow\n- Root cause diagnosis of reported bugs\n- Finding where specific logic or variables live\n- Refactoring recommendations and unit tests\n\nWhat would you like to explore?",
      timestamp: new Date(),
    },
  ])

  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const sendMessage = async (text?: string) => {
    const query = text || input.trim()
    if (!query || loading) return

    const userMessage: Message = {
      id: Date.now(),
      role: 'user',
      content: query,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    // Reset textarea height
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
    }

    try {
      const res = await analysisApi.chat(id, query)
      const assistantMessage: Message = {
        id: Date.now() + 1,
        role: 'assistant',
        content: res.data.response || 'No response generated. Please refine your question.',
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, assistantMessage])
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Chat query failed')
      setMessages(prev => prev.slice(0, -1)) // rollback user message on failure
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const clearChat = () => {
    if (confirm('Clear message history?')) {
      setMessages([messages[0]])
    }
  }

  return (
    <div className="h-screen bg-gray-950 text-gray-100 flex flex-col overflow-hidden">
      <Navbar showDashboardLink />

      {/* Chat Top Sub-bar */}
      <div className="pt-16 border-b border-gray-800 bg-gray-900/50 backdrop-blur-md px-4 sm:px-6 py-2.5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <Link
            to={`/repo/${id}`}
            className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2 truncate">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse shrink-0" />
            <span className="text-xs font-semibold text-white truncate">RAG Code Intelligence</span>
            <span className="hidden sm:inline-block text-[10px] font-mono text-gray-500 bg-gray-800 px-2 py-0.5 rounded">
              ChromaDB Top-K Search
            </span>
          </div>
        </div>

        <button
          onClick={clearChat}
          className="text-xs text-gray-500 hover:text-gray-300 flex items-center gap-1 p-1.5 rounded-lg hover:bg-gray-800 transition-colors"
          title="Clear Conversation"
        >
          <Eraser className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Clear</span>
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-3 sm:px-6 py-4 space-y-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((msg) => {
            const isUser = msg.role === 'user'

            return (
              <div
                key={msg.id}
                className={`flex gap-2.5 sm:gap-3.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Avatar */}
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                    isUser ? 'bg-blue-600 text-white' : 'gradient-brand text-white shadow-md shadow-blue-900/30'
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                {/* Message Bubble */}
                <div
                  className={`max-w-[88%] sm:max-w-[78%] rounded-2xl px-4 py-3 sm:px-5 sm:py-3.5 text-xs sm:text-sm leading-relaxed ${
                    isUser
                      ? 'bg-blue-600 text-white rounded-tr-sm shadow-sm'
                      : 'card border-gray-800 bg-gray-900/90 text-gray-100 rounded-tl-sm'
                  }`}
                >
                  {isUser ? (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  ) : (
                    <div className="prose prose-invert prose-xs sm:prose-sm max-w-none space-y-2">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          code({ className, children, ...props }: any) {
                            const match = /language-(\w+)/.exec(className || '')
                            const codeString = String(children).replace(/\n$/, '')
                            if (match) {
                              return <ChatCodeBlock code={codeString} language={match[1]} />
                            }
                            return (
                              <code className="bg-gray-800/80 text-blue-300 px-1.5 py-0.5 rounded text-[11px] font-mono" {...props}>
                                {children}
                              </code>
                            )
                          },
                          p({ children }) {
                            return <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>
                          },
                          ul({ children }) {
                            return <ul className="list-disc pl-4 space-y-1 mb-2">{children}</ul>
                          },
                          ol({ children }) {
                            return <ol className="list-decimal pl-4 space-y-1 mb-2">{children}</ol>
                          },
                          h1({ children }) {
                            return <h1 className="text-base font-bold text-white mb-2">{children}</h1>
                          },
                          h2({ children }) {
                            return <h2 className="text-sm font-bold text-white mb-1.5">{children}</h2>
                          },
                          h3({ children }) {
                            return <h3 className="text-xs font-bold text-white mb-1">{children}</h3>
                          },
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  )}

                  <div className="text-[10px] opacity-40 mt-1.5 text-right font-mono">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            )
          })}

          {/* Typing Indicator */}
          {loading && (
            <div className="flex gap-2.5 sm:gap-3.5">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl gradient-brand flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="card px-4 py-3 border-gray-800 bg-gray-900 rounded-tl-sm flex items-center gap-2">
                <Spinner size="sm" />
                <span className="text-xs text-gray-400">Searching codebase vectors & drafting response...</span>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Suggested chips (horizontal scroll for mobile) */}
      {messages.length <= 2 && (
        <div className="px-3 sm:px-6 py-2 border-t border-gray-800/60 bg-gray-900/30 shrink-0">
          <div className="max-w-4xl mx-auto flex items-center gap-2 overflow-x-auto scrollbar-none py-1">
            <span className="text-[11px] font-semibold text-gray-400 shrink-0 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-blue-400" /> Prompts:
            </span>
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => sendMessage(s)}
                className="text-xs whitespace-nowrap bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700/60 px-3 py-1.5 rounded-full transition-colors shrink-0"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Composer Bar */}
      <div className="border-t border-gray-800 bg-gray-900/90 backdrop-blur-md px-3 sm:px-6 py-3 shrink-0 safe-bottom">
        <div className="max-w-4xl mx-auto flex items-end gap-2 sm:gap-3">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={(e) => {
                setInput(e.target.value)
                e.target.style.height = 'auto'
                e.target.style.height = `${Math.min(e.target.scrollHeight, 140)}px`
              }}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about this codebase... (Enter to send)"
              className="input py-2.5 sm:py-3 pr-4 text-xs sm:text-sm bg-gray-950 border-gray-800 resize-none max-h-36 leading-relaxed"
            />
          </div>

          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className="btn-primary p-3 rounded-xl shrink-0 shadow-md shadow-blue-900/40"
            title="Send Message"
          >
            {loading ? <Spinner size="sm" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  )
}
