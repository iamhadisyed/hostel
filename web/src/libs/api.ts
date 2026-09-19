const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api'

const TOKEN_KEY = 'hostel_auth_token'

export const getToken = (): string | null => {
  if (typeof window === 'undefined') return null

  return window.localStorage.getItem(TOKEN_KEY)
}

export const setToken = (token: string | null) => {
  if (typeof window === 'undefined') return

  if (token) {
    window.localStorage.setItem(TOKEN_KEY, token)
  } else {
    window.localStorage.removeItem(TOKEN_KEY)
  }
}

export class ApiError extends Error {
  status: number
  errors?: Record<string, string[]>

  constructor(message: string, status: number, errors?: Record<string, string[]>) {
    super(message)
    this.status = status
    this.errors = errors
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  body?: unknown
  isFormData?: boolean
  auth?: boolean
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, isFormData = false, auth = true } = options

  const headers: Record<string, string> = {
    Accept: 'application/json'
  }

  if (!isFormData) {
    headers['Content-Type'] = 'application/json'
  }

  if (auth) {
    const token = getToken()

    if (token) {
      headers.Authorization = `Bearer ${token}`
    }
  }

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? (isFormData ? (body as FormData) : JSON.stringify(body)) : undefined
  })

  if (response.status === 204) {
    return undefined as T
  }

  const contentType = response.headers.get('content-type') ?? ''
  const data = contentType.includes('application/json') ? await response.json() : await response.text()

  if (!response.ok) {
    const message = typeof data === 'object' && data !== null && 'message' in data ? String(data.message) : 'Request failed'
    const errors = typeof data === 'object' && data !== null && 'errors' in data ? (data.errors as Record<string, string[]>) : undefined

    if (response.status === 401 && typeof window !== 'undefined') {
      setToken(null)
    }

    throw new ApiError(message, response.status, errors)
  }

  return data as T
}

export const api = {
  get: <T>(path: string, auth = true) => apiFetch<T>(path, { method: 'GET', auth }),
  post: <T>(path: string, body?: unknown, auth = true) => apiFetch<T>(path, { method: 'POST', body, auth }),
  patch: <T>(path: string, body?: unknown, auth = true) => apiFetch<T>(path, { method: 'PATCH', body, auth }),
  delete: <T>(path: string, auth = true) => apiFetch<T>(path, { method: 'DELETE', auth }),
  postForm: <T>(path: string, formData: FormData, auth = true) =>
    apiFetch<T>(path, { method: 'POST', body: formData, isFormData: true, auth })
}
