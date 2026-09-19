'use client'

import { useEffect, useState } from 'react'

import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'

import { api, ApiError } from '@/libs/api'
import type { AvailabilityRoomType, Hotel } from '@/types/api'
import { useAuth } from '@/contexts/AuthContext'

const AvailabilityView = () => {
  const { user } = useAuth()
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [openHotel, setOpenHotel] = useState<Hotel | null>(null)
  const [roomTypes, setRoomTypes] = useState<AvailabilityRoomType[]>([])
  const [bookingInfo, setBookingInfo] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.get<Hotel[]>('/hotels')

        setHotels(data)
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Failed to load properties.')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const viewAvailability = async (hotel: Hotel) => {
    setOpenHotel(hotel)

    try {
      const data = await api.get<{ room_types: AvailabilityRoomType[] }>(`/hotels/${hotel.id}/availability`, false)

      setRoomTypes(data.room_types)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load availability.')
    }
  }

  const requestBed = async (roomTypeId: number, bedId: number) => {
    if (!openHotel) return

    if (!user?.email_verified_at) {
      setBookingInfo('Please verify your email before submitting a booking request.')

      return
    }

    try {
      await api.post('/bookings', { hotel_id: openHotel.id, room_type_id: roomTypeId, bed_id: bedId })
      setBookingInfo('Booking request submitted! Track its status on the My Booking page.')
      setOpenHotel(null)
    } catch (err) {
      setBookingInfo(err instanceof ApiError ? err.message : 'Failed to submit booking request.')
    }
  }

  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <Typography variant='h4'>Browse Properties</Typography>
        <Typography color='text.secondary'>
          You can browse room and seat availability even before your email is verified.
        </Typography>
      </Grid>

      {error && (
        <Grid size={{ xs: 12 }}>
          <Alert severity='error'>{error}</Alert>
        </Grid>
      )}
      {bookingInfo && (
        <Grid size={{ xs: 12 }}>
          <Alert severity='info' onClose={() => setBookingInfo(null)}>
            {bookingInfo}
          </Alert>
        </Grid>
      )}

      {loading ? (
        <Grid size={{ xs: 12 }} className='flex justify-center p-8'>
          <CircularProgress />
        </Grid>
      ) : (
        hotels.map(hotel => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={hotel.id}>
            <Card>
              <CardContent className='flex flex-col gap-2'>
                <Typography variant='h6'>{hotel.name}</Typography>
                <Typography color='text.secondary'>{hotel.city}</Typography>
                <Chip size='small' label={hotel.building_type} className='is-fit capitalize' />
                <Button variant='outlined' onClick={() => viewAvailability(hotel)}>
                  View Availability
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))
      )}

      <Dialog open={!!openHotel} onClose={() => setOpenHotel(null)} maxWidth='md' fullWidth>
        <DialogTitle>{openHotel?.name} - Availability</DialogTitle>
        <DialogContent className='flex flex-col gap-4'>
          {roomTypes.map(rt => (
            <Card key={rt.id} variant='outlined'>
              <CardContent>
                <div className='flex items-center justify-between'>
                  <Typography variant='subtitle1'>{rt.name}</Typography>
                  <Typography variant='subtitle1' color='primary'>
                    Rs. {rt.monthly_price} / month
                  </Typography>
                </div>
                <Typography variant='caption' color='text.secondary'>
                  {rt.available_beds} of {rt.total_beds} beds available
                </Typography>
                <div className='flex flex-wrap gap-2 mbs-3'>
                  {rt.rooms.flatMap(room =>
                    room.beds.map(bed => (
                      <Chip
                        key={bed.id}
                        label={`Room ${room.room_number} - Bed ${bed.bed_number}`}
                        color={bed.status === 'available' ? 'success' : 'default'}
                        onClick={bed.status === 'available' ? () => requestBed(rt.id, bed.id) : undefined}
                        clickable={bed.status === 'available'}
                      />
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenHotel(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Grid>
  )
}

export default AvailabilityView
