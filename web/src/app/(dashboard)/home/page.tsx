'use client'

import { useEffect } from 'react'

import { useRouter } from 'next/navigation'

import CircularProgress from '@mui/material/CircularProgress'

import { useAuth, homeRouteForRole } from '@/contexts/AuthContext'

export default function Page() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return

    router.replace(user ? homeRouteForRole(user.role) : '/login')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading])

  return (
    <div className='flex items-center justify-center min-bs-[60dvh]'>
      <CircularProgress />
    </div>
  )
}
