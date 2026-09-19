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
import type { User } from '@/types/api'
import { useMyHotels } from '@/hooks/useMyHotels'

const AccountsView = () => {
  const { hotels, selectedHotelId, setSelectedHotelId } = useMyHotels()
  const [accounts, setAccounts] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', role: 'warden' })
  const [submitting, setSubmitting] = useState(false)

  const load = async () => {
    if (!selectedHotelId) return

    setLoading(true)
    setError(null)

    try {
      const data = await api.get<User[]>(`/hotels/${selectedHotelId}/accounts`)

      setAccounts(data)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load accounts.')
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
      await api.post(`/hotels/${selectedHotelId}/accounts`, form)
      setDialogOpen(false)
      setForm({ name: '', email: '', password: '', phone: '', role: 'warden' })
      load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create account.')
    } finally {
      setSubmitting(false)
    }
  }

  const deactivate = async (user: User) => {
    if (!selectedHotelId) return

    try {
      await api.delete(`/hotels/${selectedHotelId}/accounts/${user.id}`)
      load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to deactivate account.')
    }
  }

  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }} className='flex items-center justify-between'>
        <Typography variant='h4'>Warden & Front Desk Accounts</Typography>
        <Button variant='contained' onClick={() => setDialogOpen(true)} disabled={!selectedHotelId}>
          + New Account
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
          <CardHeader title='Accounts' />
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
                    <TableCell>Email</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {accounts.map(account => (
                    <TableRow key={account.id}>
                      <TableCell>{account.name}</TableCell>
                      <TableCell>{account.email}</TableCell>
                      <TableCell className='capitalize'>{account.role.replace('_', ' ')}</TableCell>
                      <TableCell>
                        <Chip
                          size='small'
                          label={account.is_active ? 'Active' : 'Deactivated'}
                          color={account.is_active ? 'success' : 'default'}
                        />
                      </TableCell>
                      <TableCell>
                        {account.is_active && (
                          <Button size='small' color='error' onClick={() => deactivate(account)}>
                            Deactivate
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {accounts.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className='text-center'>
                        No accounts yet.
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
        <DialogTitle>New Account</DialogTitle>
        <DialogContent className='flex flex-col gap-4 pbs-4'>
          <TextField
            select
            fullWidth
            label='Role'
            value={form.role}
            onChange={e => setForm({ ...form, role: e.target.value })}
          >
            <MenuItem value='warden'>Warden / Manager</MenuItem>
            <MenuItem value='front_desk'>Front Desk / Security</MenuItem>
          </TextField>
          <TextField fullWidth label='Name' value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          <TextField
            fullWidth
            label='Email'
            type='email'
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
          />
          <TextField fullWidth label='Phone' value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
          <TextField
            fullWidth
            label='Password'
            type='password'
            value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant='contained' onClick={handleCreate} disabled={submitting}>
            {submitting ? 'Creating...' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  )
}

export default AccountsView
