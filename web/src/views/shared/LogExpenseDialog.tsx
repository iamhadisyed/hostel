'use client'

import { useState } from 'react'

import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Grid from '@mui/material/Grid'
import Alert from '@mui/material/Alert'

import { api, ApiError } from '@/libs/api'

const LogExpenseDialog = ({
  hotelId,
  open,
  onClose,
  onCreated
}: {
  hotelId: number
  open: boolean
  onClose: () => void
  onCreated: () => void
}) => {
  const [category, setCategory] = useState('utility')
  const [vendor, setVendor] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [receipt, setReceipt] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const reset = () => {
    setCategory('utility')
    setVendor('')
    setAmount('')
    setDate(new Date().toISOString().slice(0, 10))
    setReceipt(null)
    setError(null)
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    setError(null)

    const formData = new FormData()

    formData.append('category', category)
    formData.append('vendor', vendor)
    formData.append('amount', amount)
    formData.append('date', date)
    if (receipt) formData.append('receipt', receipt)

    try {
      await api.postForm(`/hotels/${hotelId}/expenses`, formData)
      reset()
      onCreated()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to log expense.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth='sm' fullWidth>
      <DialogTitle>Log Expense</DialogTitle>
      <DialogContent className='flex flex-col gap-4 pbs-4'>
        {error && <Alert severity='error'>{error}</Alert>}
        <Grid container spacing={4}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField select fullWidth label='Category' value={category} onChange={e => setCategory(e.target.value)}>
              <MenuItem value='vendor_payment'>Vendor Payment</MenuItem>
              <MenuItem value='utility'>Utility</MenuItem>
              <MenuItem value='maintenance'>Maintenance</MenuItem>
              <MenuItem value='other'>Other</MenuItem>
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField fullWidth label='Vendor' value={vendor} onChange={e => setVendor(e.target.value)} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField fullWidth type='number' label='Amount' value={amount} onChange={e => setAmount(e.target.value)} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              type='date'
              label='Date'
              value={date}
              onChange={e => setDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Button component='label' variant='outlined'>
              {receipt ? receipt.name : 'Upload Receipt (optional)'}
              <input hidden type='file' accept='.jpg,.jpeg,.png,.pdf' onChange={e => setReceipt(e.target.files?.[0] ?? null)} />
            </Button>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant='contained' onClick={handleSubmit} disabled={submitting}>
          {submitting ? 'Saving...' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default LogExpenseDialog
