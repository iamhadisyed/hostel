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
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'

import { api, ApiError } from '@/libs/api'
import type { AvailabilityRoomType, Booking, BookingStatus } from '@/types/api'
import { useMyHotels } from '@/hooks/useMyHotels'

const statusColor: Record<BookingStatus, 'default' | 'success' | 'error' | 'warning' | 'info'> = {
  pending: 'warning',
  approved: 'info',
  active: 'success',
  checked_out: 'default',
  rejected: 'error',
  cancelled: 'error'
}

const FrontDeskBookingsView = () => {
  const { hotels, selectedHotelId, setSelectedHotelId } = useMyHotels()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [availability, setAvailability] = useState<AvailabilityRoomType[]>([])

  const [form, setForm] = useState({
    room_type_id: '',
    bed_id: '',
    guest_name: '',
    guest_phone: '',
    guest_cnic: '',
    guest_email: ''
  })
  const [submitting, setSubmitting] = useState(false)

  const load = async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await api.get<Booking[]>('/bookings')

      setBookings(data.filter(b => !selectedHotelId || b.hotel_id === selectedHotelId))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load bookings.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedHotelId])

  const openDialog = async () => {
    if (!selectedHotelId) return

    try {
      const data = await api.get<{ room_types: AvailabilityRoomType[] }>(`/hotels/${selectedHotelId}/availability`)

      setAvailability(data.room_types)
      setDialogOpen(true)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load availability.')
    }
  }

  const availableBeds = availability
    .find(rt => String(rt.id) === form.room_type_id)
    ?.rooms.flatMap(r => r.beds.filter(b => b.status === 'available').map(b => ({ ...b, room_number: r.room_number }))) ?? []

  const handleCreate = async () => {
    if (!selectedHotelId) return

    setSubmitting(true)
    setError(null)

    try {
      await api.post('/bookings/walk-in', {
        hotel_id: selectedHotelId,
        room_type_id: Number(form.room_type_id),
        bed_id: Number(form.bed_id),
        guest: { name: form.guest_name, phone: form.guest_phone, cnic: form.guest_cnic, email: form.guest_email || undefined }
      })
      setDialogOpen(false)
      setForm({ room_type_id: '', bed_id: '', guest_name: '', guest_phone: '', guest_cnic: '', guest_email: '' })
      load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create booking.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }} className='flex items-center justify-between'>
        <Typography variant='h4'>Bookings</Typography>
        <Button variant='contained' onClick={openDialog} disabled={!selectedHotelId}>
          + Register Walk-in Guest
        </Button>
      </Grid>

      <Grid size={{ xs: 12, sm: 6 }}>
        <TextField
          select
          fullWidth
          label='Property'
          value={selectedHotelId ?? ''}
          onChange={e => setSelectedHotelId(Number(e.target.value))}
        >
          {hotels.map(h => (
            <MenuItem key={h.id} value={h.id}>
              {h.name}
            </MenuItem>
          ))}
        </TextField>
      </Grid>

      {error && (
        <Grid size={{ xs: 12 }}>
          <Alert severity='error'>{error}</Alert>
        </Grid>
      )}

      <Grid size={{ xs: 12 }}>
        <Card>
          <CardHeader title='Occupants & Bookings (read-only)' />
          <CardContent>
            {loading ? (
              <div className='flex justify-center p-8'>
                <CircularProgress />
              </div>
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Guest</TableCell>
                    <TableCell>Room</TableCell>
                    <TableCell>Bed</TableCell>
                    <TableCell>Created By</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {bookings.map(booking => (
                    <TableRow key={booking.id}>
                      <TableCell>{booking.guest?.name ?? `Guest #${booking.user_id}`}</TableCell>
                      <TableCell>{booking.room?.room_number ?? '-'}</TableCell>
                      <TableCell>{booking.bed?.bed_number ?? '-'}</TableCell>
                      <TableCell className='capitalize'>{booking.created_by.replace('_', ' ')}</TableCell>
                      <TableCell>
                        <Chip size='small' label={booking.status} color={statusColor[booking.status]} className='capitalize' />
                      </TableCell>
                    </TableRow>
                  ))}
                  {bookings.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className='text-center'>
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

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle>Register Walk-in Guest</DialogTitle>
        <DialogContent className='flex flex-col gap-4 pbs-4'>
          <Alert severity='info'>In-person CNIC verification substitutes for email OTP. Approval by Warden/Owner is still required.</Alert>
          <TextField
            fullWidth
            label='Guest Name'
            value={form.guest_name}
            onChange={e => setForm({ ...form, guest_name: e.target.value })}
          />
          <TextField
            fullWidth
            label='Phone'
            value={form.guest_phone}
            onChange={e => setForm({ ...form, guest_phone: e.target.value })}
          />
          <TextField
            fullWidth
            label='CNIC / B-Form'
            value={form.guest_cnic}
            onChange={e => setForm({ ...form, guest_cnic: e.target.value })}
          />
          <TextField
            fullWidth
            label='Email (optional)'
            value={form.guest_email}
            onChange={e => setForm({ ...form, guest_email: e.target.value })}
          />
          <TextField
            select
            fullWidth
            label='Room Type'
            value={form.room_type_id}
            onChange={e => setForm({ ...form, room_type_id: e.target.value, bed_id: '' })}
          >
            {availability.map(rt => (
              <MenuItem key={rt.id} value={String(rt.id)}>
                {rt.name} ({rt.available_beds} available)
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            fullWidth
            label='Bed'
            value={form.bed_id}
            onChange={e => setForm({ ...form, bed_id: e.target.value })}
            disabled={!form.room_type_id}
          >
            {availableBeds.map(bed => (
              <MenuItem key={bed.id} value={String(bed.id)}>
                Room {bed.room_number} - Bed {bed.bed_number}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant='contained' onClick={handleCreate} disabled={submitting}>
            {submitting ? 'Registering...' : 'Register & Book'}
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  )
}

export default FrontDeskBookingsView
