'use client'

import { useState } from 'react'

import { useRouter } from 'next/navigation'

import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'

import Link from '@components/Link'
import Logo from '@components/layout/shared/Logo'
import AuthHero from '@components/auth/AuthHero'

import { useAuth } from '@/contexts/AuthContext'
import { ApiError } from '@/libs/api'

const Register = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '', password_confirmation: '', phone: '' })
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const router = useRouter()
  const { register } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      await register(form)
      router.push('/verify-otp')
    } catch (err) {
      if (err instanceof ApiError && err.errors) {
        setError(Object.values(err.errors).flat().join(' '))
      } else {
        setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className='flex bs-full justify-center'>
      <AuthHero title='Book your stay in minutes.' subtitle='Browse rooms, submit a request, and manage your stay from one account.' />

      <div className='flex justify-center items-center bs-full bg-backgroundPaper !min-is-full p-6 md:!min-is-[unset] md:p-12 md:is-[480px] relative'>
        <Link className='absolute block-start-5 sm:block-start-[38px] inline-start-6 sm:inline-start-[38px]'>
          <Logo />
        </Link>
        <div className='flex flex-col gap-5 is-full sm:is-auto md:is-full sm:max-is-[400px] md:max-is-[unset] mbs-11 sm:mbs-14 md:mbs-0'>
          <div>
            <Typography variant='h4'>Create your account</Typography>
            <Typography className='mbs-1'>Browse room availability, then register to submit your booking request.</Typography>
          </div>
          {error && <Alert severity='error'>{error}</Alert>}
          <form noValidate autoComplete='off' onSubmit={handleSubmit} className='flex flex-col gap-5'>
            <TextField
              autoFocus
              fullWidth
              label='Full Name'
              required
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
            />
            <TextField
              fullWidth
              label='Email'
              type='email'
              required
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
            />
            <TextField
              fullWidth
              label='Phone'
              value={form.phone}
              onChange={e => setForm({ ...form, phone: e.target.value })}
            />
            <TextField
              fullWidth
              label='Password'
              type='password'
              required
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
            />
            <TextField
              fullWidth
              label='Confirm Password'
              type='password'
              required
              value={form.password_confirmation}
              onChange={e => setForm({ ...form, password_confirmation: e.target.value })}
            />
            <Button fullWidth variant='contained' type='submit' disabled={submitting}>
              {submitting ? 'Creating account...' : 'Register'}
            </Button>
            <div className='flex justify-center items-center flex-wrap gap-2'>
              <Typography>Already have an account?</Typography>
              <Typography component={Link} href='/login' color='primary.main'>
                Log in
              </Typography>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Register
