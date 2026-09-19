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

const HotelsView = () => {
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

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
                    <TableCell>Type</TableCell>
                    <TableCell>City</TableCell>
                    <TableCell>Owner</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {hotels.map(hotel => (
                    <TableRow key={hotel.id}>
                      <TableCell>{hotel.name}</TableCell>
                      <TableCell className='capitalize'>{hotel.building_type}</TableCell>
                      <TableCell>{hotel.city ?? '-'}</TableCell>
                      <TableCell>{hotel.owner?.name ?? '-'}</TableCell>
                      <TableCell>
                        <Chip
                          size='small'
                          label={hotel.is_active ? 'Active' : 'Inactive'}
                          color={hotel.is_active ? 'success' : 'default'}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                  {hotels.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className='text-center'>
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
    </Grid>
  )
}

export default HotelsView
