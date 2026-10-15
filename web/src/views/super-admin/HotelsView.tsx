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
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'

import { api, ApiError } from '@/libs/api'
import type { Hotel } from '@/types/api'
import CreateHotelDialog from './CreateHotelDialog'
import BillingDialog from './BillingDialog'

const HotelsView = () => {
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [billingHotel, setBillingHotel] = useState<Hotel | null>(null)
  const [togglingId, setTogglingId] = useState<number | null>(null)

  const loadHotels = async () => {
    setLoading(true)

    try {
      const data = await api.get<Hotel[]>('/hotels')

      setHotels(data)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load hotels.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadHotels()
  }, [])

  const toggleActive = async (hotel: Hotel) => {
    setTogglingId(hotel.id)
    setError(null)

    try {
      await api.patch(`/hotels/${hotel.id}`, { is_active: !hotel.is_active })
      await loadHotels()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update property status.')
    } finally {
      setTogglingId(null)
    }
  }

  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }} className='flex items-center justify-between'>
        <Typography variant='h4'>Properties</Typography>
        <Button variant='contained' onClick={() => setDialogOpen(true)}>
          + Onboard New Property
        </Button>
      </Grid>

      {error && (
        <Grid size={{ xs: 12 }}>
          <Alert severity='error'>{error}</Alert>
        </Grid>
      )}

      <Grid size={{ xs: 12 }}>
        <Card>
          <CardHeader title='All Properties' />
          <CardContent>
            {loading ? (
              <div className='flex justify-center p-8'>
                <CircularProgress />
              </div>
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Property Type</TableCell>
                    <TableCell>City</TableCell>
                    <TableCell>Owner</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align='right'>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {hotels.map(hotel => (
                    <TableRow key={hotel.id}>
                      <TableCell>{hotel.name}</TableCell>
                      <TableCell className='capitalize'>{hotel.property_type}</TableCell>
                      <TableCell>{hotel.city ?? '-'}</TableCell>
                      <TableCell>{hotel.owner?.name ?? '-'}</TableCell>
                      <TableCell>
                        <Chip
                          size='small'
                          label={hotel.is_active ? 'Active' : 'Inactive'}
                          color={hotel.is_active ? 'success' : 'default'}
                        />
                      </TableCell>
                      <TableCell align='right'>
                        <div className='flex gap-2 justify-end'>
                          <Button size='small' onClick={() => setBillingHotel(hotel)}>
                            Billing
                          </Button>
                          <Button
                            size='small'
                            color={hotel.is_active ? 'error' : 'success'}
                            disabled={togglingId === hotel.id}
                            onClick={() => toggleActive(hotel)}
                          >
                            {hotel.is_active ? 'Deactivate' : 'Activate'}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {hotels.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className='text-center'>
                        No properties yet. Onboard your first one.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </Grid>

      <CreateHotelDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onCreated={() => {
          setDialogOpen(false)
          loadHotels()
        }}
      />

      <BillingDialog hotel={billingHotel} open={billingHotel !== null} onClose={() => setBillingHotel(null)} />
    </Grid>
  )
}

export default HotelsView
