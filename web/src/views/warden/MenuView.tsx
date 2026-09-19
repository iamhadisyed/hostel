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
import MenuItemMui from '@mui/material/MenuItem'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Switch from '@mui/material/Switch'
import FormControlLabel from '@mui/material/FormControlLabel'

import { api, ApiError } from '@/libs/api'
import type { MenuItem } from '@/types/api'
import { useMyHotels } from '@/hooks/useMyHotels'

const MenuView = () => {
  const { hotels, selectedHotelId, setSelectedHotelId } = useMyHotels()
  const [items, setItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', price: '' })
  const [submitting, setSubmitting] = useState(false)

  const load = async () => {
    if (!selectedHotelId) return

    setLoading(true)
    setError(null)

    try {
      const data = await api.get<MenuItem[]>(`/hotels/${selectedHotelId}/menu`)

      setItems(data)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load menu.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedHotelId])

  const handleCreate = async () => {
    if (!selectedHotelId) return

    setSubmitting(true)
    setError(null)

    try {
      await api.post(`/hotels/${selectedHotelId}/menu`, { ...form, price: Number(form.price) })
      setDialogOpen(false)
      setForm({ name: '', description: '', price: '' })
      load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to add item.')
    } finally {
      setSubmitting(false)
    }
  }

  const toggleAvailability = async (item: MenuItem) => {
    if (!selectedHotelId) return

    try {
      await api.patch(`/hotels/${selectedHotelId}/menu/${item.id}`, { is_available: !item.is_available })
      load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update item.')
    }
  }

  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }} className='flex items-center justify-between'>
        <Typography variant='h4'>Food Menu</Typography>
        <Button variant='contained' onClick={() => setDialogOpen(true)} disabled={!selectedHotelId}>
          + Add Item
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
            <MenuItemMui key={h.id} value={h.id}>
              {h.name}
            </MenuItemMui>
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
          <CardHeader title='Menu Items' />
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
                    <TableCell>Description</TableCell>
                    <TableCell>Price</TableCell>
                    <TableCell>Available</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.map(item => (
                    <TableRow key={item.id}>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{item.description ?? '-'}</TableCell>
                      <TableCell>Rs. {item.price}</TableCell>
                      <TableCell>
                        <FormControlLabel
                          control={<Switch checked={item.is_available} onChange={() => toggleAvailability(item)} />}
                          label={item.is_available ? 'Yes' : 'No'}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                  {items.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className='text-center'>
                        No menu items yet.
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
        <DialogTitle>Add Menu Item</DialogTitle>
        <DialogContent className='flex flex-col gap-4 pbs-4'>
          <TextField fullWidth label='Name' value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          <TextField
            fullWidth
            label='Description'
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
          />
          <TextField fullWidth type='number' label='Price' value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant='contained' onClick={handleCreate} disabled={submitting}>
            {submitting ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  )
}

export default MenuView
