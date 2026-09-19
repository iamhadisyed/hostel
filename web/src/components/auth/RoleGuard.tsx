'use client'

import { useEffect } from 'react'
import type { ReactNode } from 'react'

import { useRouter } from 'next/navigation'

import CircularProgress from '@mui/material/CircularProgress'

import { useAuth, homeRouteForRole } from '@/contexts/AuthContext'
import type { Role } from '@/types/api'

const RoleGuard = ({ allow, children }: { allow: Role[]; children: ReactNode }) => {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return

    if (!user) {
      router.replace('/login')

      return
    }

    if (!allow.includes(user.role)) {
      router.replace(homeRouteForRole(user.role))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading])

  if (loading || !user || !allow.includes(user.role)) {
    return (
      <div className='flex items-center justify-center min-bs-[60dvh]'>
        <CircularProgress />
      </div>
    )
  }

  return <>{children}</>
}

export default RoleGuard
