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
import type { VisitorPass } from '@/types/api'
import { useMyHotels } from '@/hooks/useMyHotels'

const VisitorsView = () => {
  const { hotels, selectedHotelId, setSelectedHotelId } = useMyHotels()
  const [passes, setPasses] = useState<VisitorPass[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState({ visitor_name: '', cnic: '', phone: '', purpose: '' })
  const [submitting, setSubmitting] = useState(false)

  const load = async () => {
    if (!selectedHotelId) return

    setLoading(true)
    setError(null)

    try {
      const data = await api.get<VisitorPass[]>(`/hotels/${selectedHotelId}/visitor-passes`)

      setPasses(data)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load visitor passes.')
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
      await api.post(`/hotels/${selectedHotelId}/visitor-passes`, form)
      setDialogOpen(false)
      setForm({ visitor_name: '', cnic: '', phone: '', purpose: '' })
      load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to log visitor.')
    } finally {
      setSubmitting(false)
    }
  }

  const checkout = async (pass: VisitorPass) => {
    if (!selectedHotelId) return

    try {
      await api.patch(`/hotels/${selectedHotelId}/visitor-passes/${pass.id}/checkout`)
      load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to check out visitor.')
    }
  }

  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }} className='flex items-center justify-between'>
        <Typography variant='h4'>Visitor Passes</Typography>
        <Button variant='contained' onClick={() => setDialogOpen(true)} disabled={!selectedHotelId}>
          + Log Visitor
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
          <CardHeader title='Visitor Log' />
          <CardContent>
            {loading ? (
              <div className='flex justify-center p-8'>
                <CircularProgress />
              </div>
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Visitor</TableCell>
                    <TableCell>Purpose</TableCell>
                    <TableCell>Checked In</TableCell>
                    <TableCell>Checked Out</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {passes.map(pass => (
                    <TableRow key={pass.id}>
                      <TableCell>{pass.visitor_name}</TableCell>
                      <TableCell>{pass.purpose ?? '-'}</TableCell>
                      <TableCell>{new Date(pass.checked_in_at).toLocaleString()}</TableCell>
                      <TableCell>
                        {pass.checked_out_at ? (
                          <Chip size='small' label='Checked Out' />
                        ) : (
                          <Chip size='small' color='success' label='On Premises' />
                        )}
                      </TableCell>
                      <TableCell>
                        {!pass.checked_out_at && (
                          <Button size='small' onClick={() => checkout(pass)}>
                            Check Out
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {passes.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className='text-center'>
                        No visitors logged yet.
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
        <DialogTitle>Log Visitor</DialogTitle>
        <DialogContent className='flex flex-col gap-4 pbs-4'>
          <TextField
            fullWidth
            label='Visitor Name'
            value={form.visitor_name}
            onChange={e => setForm({ ...form, visitor_name: e.target.value })}
          />
          <TextField fullWidth label='CNIC' value={form.cnic} onChange={e => setForm({ ...form, cnic: e.target.value })} />
          <TextField fullWidth label='Phone' value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
          <TextField
            fullWidth
            label='Purpose of Visit'
            value={form.purpose}
            onChange={e => setForm({ ...form, purpose: e.target.value })}
          />
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

export default VisitorsView
