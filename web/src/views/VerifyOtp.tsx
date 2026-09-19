'use client'

import { useState } from 'react'

import { useRouter } from 'next/navigation'

import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'

import Link from '@components/Link'
import Logo from '@components/layout/shared/Logo'

import { useAuth, homeRouteForRole } from '@/contexts/AuthContext'
import { api, ApiError } from '@/libs/api'

const VerifyOtp = () => {
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [resending, setResending] = useState(false)

  const router = useRouter()
  const { user, refreshUser } = useAuth()

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      await api.post('/otp/verify', { code })
      await refreshUser()
      router.push(user ? homeRouteForRole(user.role) : '/login')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Verification failed.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleResend = async () => {
    setError(null)
    setInfo(null)
    setResending(true)

    try {
      const res = await api.post<{ message: string }>('/otp/send')

      setInfo(res.message)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not resend code.')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className='flex bs-full items-center justify-center p-6'>
      <Card className='is-full sm:is-[440px]'>
        <CardContent className='flex flex-col gap-5 p-8'>
          <Link className='flex justify-center'>
            <Logo />
          </Link>
          <div className='text-center'>
            <Typography variant='h4'>Verify your email</Typography>
            <Typography className='mbs-1'>
              Enter the 6-digit code we emailed you{user?.email ? ` to ${user.email}` : ''}.
            </Typography>
          </div>
          {error && <Alert severity='error'>{error}</Alert>}
          {info && <Alert severity='success'>{info}</Alert>}
          <form noValidate autoComplete='off' onSubmit={handleVerify} className='flex flex-col gap-5'>
            <TextField
              autoFocus
              fullWidth
              label='Verification Code'
              value={code}
              onChange={e => setCode(e.target.value)}
              required
            />
            <Button fullWidth variant='contained' type='submit' disabled={submitting}>
              {submitting ? 'Verifying...' : 'Verify'}
            </Button>
            <Button fullWidth variant='outlined' onClick={handleResend} disabled={resending}>
              {resending ? 'Resending...' : 'Resend Code'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default VerifyOtp
