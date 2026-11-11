import axios from 'axios'
import { useAuthStore } from '@/store/authStore'

const api = axios.create({ baseURL: '/api' })

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auto-logout on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) useAuthStore.getState().logout()
    return Promise.reject(err)
  }
)

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  register: (email: string, username: string, password: string) =>
    api.post('/auth/register', { email, username, password }),
  login: (email: string, password: string) =>
    api.post('/auth/login', null, { params: { username: email, password } }),
  me: () => api.get('/auth/me'),
}

// ── Repositories ──────────────────────────────────────────────────────────────
export const repoApi = {
  list: () => api.get('/repos'),
  add: (github_url: string) => api.post('/repos', { github_url }),
  get: (id: number) => api.get(`/repos/${id}`),
  delete: (id: number) => api.delete(`/repos/${id}`),
  listFiles: (id: number) => api.get(`/repos/${id}/files`),
  getFile: (id: number, path: string) => api.get(`/repos/${id}/file`, { params: { path } }),
}

// ── Analysis ──────────────────────────────────────────────────────────────────
export const analysisApi = {
  bugs: (repoId: number, filePath: string) =>
    api.post(`/analysis/${repoId}/bugs`, { file_path: filePath, analysis_type: 'bug_detection' }),
  security: (repoId: number, filePath: string) =>
    api.post(`/analysis/${repoId}/security`, { file_path: filePath, analysis_type: 'security_audit' }),
  review: (repoId: number, filePath: string) =>
    api.post(`/analysis/${repoId}/review`, { file_path: filePath, analysis_type: 'code_review' }),
  tests: (repoId: number, filePath: string) =>
    api.post(`/analysis/${repoId}/tests`, { file_path: filePath, analysis_type: 'test_generation' }),
  explain: (repoId: number, filePath: string) =>
    api.post(`/analysis/${repoId}/explain`, { file_path: filePath, analysis_type: 'explain_code' }),
  fix: (repoId: number, filePath: string, bugDescription: string) =>
    api.post(`/analysis/${repoId}/fix`, { file_path: filePath, bug_description: bugDescription }),
  prReview: (repoId: number, prNumber: number) =>
    api.post(`/analysis/${repoId}/pr-review`, { pr_number: prNumber }),
  chat: (repoId: number, message: string) =>
    api.post(`/analysis/${repoId}/chat`, { message }),
  history: (repoId: number) => api.get(`/analysis/${repoId}/history`),
}

export default api
