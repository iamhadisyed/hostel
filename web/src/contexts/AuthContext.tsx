'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'

import { useRouter } from 'next/navigation'

import { api, getToken, setToken } from '@/libs/api'
import type { User } from '@/types/api'

type AuthContextValue = {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<User>
  register: (data: { name: string; email: string; password: string; password_confirmation: string; phone?: string }) => Promise<User>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export const homeRouteForRole = (role: User['role']) => {
  switch (role) {
    case 'super_admin':
      return '/super-admin/hotels'
    case 'owner':
      return '/owner/analytics'
    case 'warden':
      return '/warden/bookings'
    case 'front_desk':
      return '/front-desk/bookings'
    case 'student':
    default:
      return '/student/availability'
  }
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const refreshUser = useCallback(async () => {
    const token = getToken()

    if (!token) {
      setUser(null)
      setLoading(false)

      return
    }

    try {
      const me = await api.get<User>('/auth/me')

      setUser(me)
    } catch {
      setToken(null)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshUser()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post<{ user: User; token: string }>('/auth/login', { email, password }, false)

    setToken(res.token)
    setUser(res.user)

    return res.user
  }, [])

  const register = useCallback(
    async (data: { name: string; email: string; password: string; password_confirmation: string; phone?: string }) => {
      const res = await api.post<{ user: User; token: string }>('/auth/register', data, false)

      setToken(res.token)
      setUser(res.user)

      return res.user
    },
    []
  )

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout')
    } catch {
      // ignore network errors on logout
    }

    setToken(null)
    setUser(null)
    router.push('/login')
  }, [router])

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>{children}</AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)

  if (!ctx) throw new Error('useAuth must be used within AuthProvider')

  return ctx
}
