import AsyncStorage from '@react-native-async-storage/async-storage'

// Point this at your Laravel backend. On a physical device or emulator,
// 'localhost' won't resolve to your dev machine - use its LAN IP instead,
// e.g. http://192.168.1.10:8000/api. Android emulators can use 10.0.2.2.
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:8000/api'

const TOKEN_KEY = 'hostel_auth_token'

let cachedToken: string | null = null

export const getToken = async (): Promise<string | null> => {
  if (cachedToken !== null) return cachedToken

  cachedToken = await AsyncStorage.getItem(TOKEN_KEY)

  return cachedToken
}

export const setToken = async (token: string | null): Promise<void> => {
  cachedToken = token

  if (token) {
    await AsyncStorage.setItem(TOKEN_KEY, token)
  } else {
    await AsyncStorage.removeItem(TOKEN_KEY)
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
    const token = await getToken()

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

    if (response.status === 401) {
      await setToken(null)
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
