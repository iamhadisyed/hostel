'use client'

import { useEffect, useState } from 'react'

import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Chip from '@mui/material/Chip'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Collapse from '@mui/material/Collapse'
import IconButton from '@mui/material/IconButton'

import { api, ApiError } from '@/libs/api'
import type { Booking, BookingStatus, Payment } from '@/types/api'

const statusColor: Record<BookingStatus, 'default' | 'success' | 'error' | 'warning' | 'info'> = {
  pending: 'warning',
  approved: 'info',
  active: 'success',
  checked_out: 'default',
  rejected: 'error',
  cancelled: 'error'
}

const BookingRow = ({ booking, onChanged }: { booking: Booking; onChanged: () => void }) => {
  const [expanded, setExpanded] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const approve = async () => {
    setBusy(true)
    setError(null)

    try {
      await api.patch(`/bookings/${booking.id}/approve`)
      onChanged()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to approve.')
    } finally {
      setBusy(false)
    }
  }

  const reject = async () => {
    setBusy(true)
    setError(null)

    try {
      await api.patch(`/bookings/${booking.id}/reject`, {})
      onChanged()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to reject.')
    } finally {
      setBusy(false)
    }
  }

  const checkout = async () => {
    setBusy(true)
    setError(null)

    try {
      await api.patch(`/bookings/${booking.id}/checkout`)
      onChanged()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to check out.')
    } finally {
      setBusy(false)
    }
  }

  const verifyPayment = async (payment: Payment, decision: 'approved' | 'rejected') => {
    setBusy(true)
    setError(null)

    try {
      await api.patch(`/payments/${payment.id}/verify`, { decision })
      onChanged()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to verify payment.')
    } finally {
      setBusy(false)
    }
  }

  const pendingPayment = booking.cycles?.[booking.cycles.length - 1]?.voucher?.payments?.find(p => p.status === 'pending')

  return (
    <>
      <TableRow>
        <TableCell>
          <IconButton size='small' onClick={() => setExpanded(!expanded)}>
            <i className={expanded ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'} />
          </IconButton>
        </TableCell>
        <TableCell>{booking.guest?.name ?? `Guest #${booking.user_id}`}</TableCell>
        <TableCell>{booking.room?.room_number ?? '-'}</TableCell>
        <TableCell>{booking.bed?.bed_number ?? '-'}</TableCell>
        <TableCell className='capitalize'>{booking.created_by.replace('_', ' ')}</TableCell>
        <TableCell>
          <Chip size='small' label={booking.status} color={statusColor[booking.status]} className='capitalize' />
        </TableCell>
        <TableCell>
          <div className='flex gap-2 flex-wrap'>
            {booking.status === 'pending' && (
              <>
                <Button size='small' color='success' disabled={busy} onClick={approve}>
                  Approve
                </Button>
                <Button size='small' color='error' disabled={busy} onClick={reject}>
                  Reject
                </Button>
              </>
            )}
            {booking.status === 'active' && (
              <Button size='small' disabled={busy} onClick={checkout}>
                Checkout
              </Button>
            )}
          </div>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell colSpan={7} className='p-0'>
          <Collapse in={expanded}>
            <div className='p-4'>
              {error && (
                <Alert severity='error' className='mbe-2'>
                  {error}
                </Alert>
              )}
              <Typography variant='subtitle2'>Billing Cycles</Typography>
              <Table size='small'>
                <TableHead>
                  <TableRow>
                    <TableCell>Period</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Voucher</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Payment</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {booking.cycles?.map(cycle => (
                    <TableRow key={cycle.id}>
                      <TableCell>
                        {cycle.period_start} - {cycle.period_end}
                      </TableCell>
                      <TableCell>Rs. {cycle.amount}</TableCell>
                      <TableCell>{cycle.voucher?.voucher_number}</TableCell>
                      <TableCell className='capitalize'>{cycle.voucher?.status}</TableCell>
                      <TableCell>
                        {cycle.voucher?.payments
                          ?.slice()
                          .reverse()
                          .map(payment => (
                            <div key={payment.id} className='flex items-center gap-2 mbe-1'>
                              <Chip size='small' label={payment.status} className='capitalize' />
                              {payment.status === 'pending' && (
                                <>
                                  <Button size='small' color='success' onClick={() => verifyPayment(payment, 'approved')}>
                                    Verify
                                  </Button>
                                  <Button size='small' color='error' onClick={() => verifyPayment(payment, 'rejected')}>
                                    Reject
                                  </Button>
                                </>
                              )}
                            </div>
                          ))}
                      </TableCell>
                    </TableRow>
                  ))}
                  {!booking.cycles?.length && (
                    <TableRow>
                      <TableCell colSpan={5} className='text-center'>
                        No billing cycle yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              {pendingPayment && (
                <Typography variant='caption' color='text.secondary'>
                  Proof path: {pendingPayment.proof_path}
                </Typography>
              )}
            </div>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  )
}

const BookingsView = () => {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)

    try {
      const list = await api.get<Booking[]>('/bookings')

      const withDetails = await Promise.all(
        list.map(b => api.get<Booking>(`/bookings/${b.id}`).catch(() => b))
      )

      setBookings(withDetails)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load bookings.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <Typography variant='h4'>Bookings</Typography>
      </Grid>

      {error && (
        <Grid size={{ xs: 12 }}>
          <Alert severity='error'>{error}</Alert>
        </Grid>
      )}

      <Grid size={{ xs: 12 }}>
        <Card>
          <CardHeader title='All Bookings' />
          <CardContent>
            {loading ? (
              <div className='flex justify-center p-8'>
                <CircularProgress />
              </div>
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell />
                    <TableCell>Guest</TableCell>
                    <TableCell>Room</TableCell>
                    <TableCell>Bed</TableCell>
                    <TableCell>Created By</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {bookings.map(booking => (
                    <BookingRow key={booking.id} booking={booking} onChanged={load} />
                  ))}
                  {bookings.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className='text-center'>
                        No bookings yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

export default BookingsView
