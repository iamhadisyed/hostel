'use client'

import { useEffect, useState } from 'react'

import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'
import Rating from '@mui/material/Rating'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'

import { api, ApiError } from '@/libs/api'
import type { Booking } from '@/types/api'

const FeedbackView = () => {
  const [booking, setBooking] = useState<Booking | null>(null)
  const [rating, setRating] = useState<number | null>(null)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const bookings = await api.get<Booking[]>('/bookings')
        const eligible = bookings.find(b => b.status === 'active' || b.status === 'checked_out') ?? null

        setBooking(eligible)
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Failed to load your booking.')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const submit = async () => {
    if (!booking || !rating) return

    setSubmitting(true)
    setError(null)

    try {
      await api.post(`/bookings/${booking.id}/feedback`, { rating, comment })
      setSuccess('Thank you for your feedback!')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to submit feedback.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className='flex justify-center p-8'>
        <CircularProgress />
      </div>
    )
  }

  if (!booking) {
    return <Alert severity='info'>Feedback is available once you have an active or completed stay.</Alert>
  }

  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <Typography variant='h4'>Feedback</Typography>
      </Grid>

      {error && (
        <Grid size={{ xs: 12 }}>
          <Alert severity='error'>{error}</Alert>
        </Grid>
      )}
      {success && (
        <Grid size={{ xs: 12 }}>
          <Alert severity='success'>{success}</Alert>
        </Grid>
      )}

      <Grid size={{ xs: 12, sm: 8, md: 6 }}>
        <Card>
          <CardHeader title={`Room ${booking.room?.room_number ?? '-'}`} />
          <CardContent className='flex flex-col gap-4'>
            <Rating value={rating} onChange={(_, val) => setRating(val)} size='large' />
            <TextField
              fullWidth
              multiline
              minRows={3}
              label='Comments (optional)'
              value={comment}
              onChange={e => setComment(e.target.value)}
            />
            <Button variant='contained' onClick={submit} disabled={!rating || submitting}>
              {submitting ? 'Submitting...' : 'Submit Feedback'}
            </Button>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

export default FeedbackView
