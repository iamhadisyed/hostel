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

import { api, ApiError } from '@/libs/api'
import type { Expense, ExpenseStatus } from '@/types/api'
import { useMyHotels } from '@/hooks/useMyHotels'
import { useAuth } from '@/contexts/AuthContext'
import LogExpenseDialog from './LogExpenseDialog'

const statusColor: Record<ExpenseStatus, 'default' | 'success' | 'error' | 'warning'> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'error'
}

const ExpensesView = () => {
  const { user } = useAuth()
  const { hotels, selectedHotelId, setSelectedHotelId } = useMyHotels()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [statusFilter, setStatusFilter] = useState<'all' | ExpenseStatus>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const canReview = user?.role === 'owner' || user?.role === 'super_admin'

  const load = async () => {
    if (!selectedHotelId) return

    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()

      if (statusFilter !== 'all') params.set('status', statusFilter)

      const data = await api.get<Expense[]>(`/hotels/${selectedHotelId}/expenses?${params.toString()}`)

      setExpenses(data)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load expenses.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedHotelId, statusFilter])

  const review = async (expense: Expense, decision: 'approved' | 'rejected') => {
    try {
      await api.patch(`/hotels/${selectedHotelId}/expenses/${expense.id}/review`, { decision })
      load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to review expense.')
    }
  }

  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }} className='flex items-center justify-between'>
        <Typography variant='h4'>Expenses</Typography>
        <Button variant='contained' onClick={() => setDialogOpen(true)} disabled={!selectedHotelId}>
          + Log Expense
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
      <Grid size={{ xs: 12, sm: 6 }}>
        <TextField
          select
          fullWidth
          label='Status'
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as typeof statusFilter)}
        >
          <MenuItem value='all'>All</MenuItem>
          <MenuItem value='pending'>Pending</MenuItem>
          <MenuItem value='approved'>Approved</MenuItem>
          <MenuItem value='rejected'>Rejected</MenuItem>
        </TextField>
      </Grid>

      {error && (
        <Grid size={{ xs: 12 }}>
          <Alert severity='error'>{error}</Alert>
        </Grid>
      )}

      <Grid size={{ xs: 12 }}>
        <Card>
          <CardHeader title='Expense Log' />
          <CardContent>
            {loading ? (
              <div className='flex justify-center p-8'>
                <CircularProgress />
              </div>
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Vendor</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Status</TableCell>
                    {canReview && <TableCell>Actions</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {expenses.map(expense => (
                    <TableRow key={expense.id}>
                      <TableCell>{expense.date}</TableCell>
                      <TableCell className='capitalize'>{expense.category.replace('_', ' ')}</TableCell>
                      <TableCell>{expense.vendor ?? '-'}</TableCell>
                      <TableCell>Rs. {expense.amount}</TableCell>
                      <TableCell>
                        <Chip size='small' label={expense.status} color={statusColor[expense.status]} className='capitalize' />
                      </TableCell>
                      {canReview && (
                        <TableCell>
                          {expense.status === 'pending' && (
                            <div className='flex gap-2'>
                              <Button size='small' color='success' onClick={() => review(expense, 'approved')}>
                                Approve
                              </Button>
                              <Button size='small' color='error' onClick={() => review(expense, 'rejected')}>
                                Reject
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                  {expenses.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={canReview ? 6 : 5} className='text-center'>
                        No expenses found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </Grid>

      {selectedHotelId && (
        <LogExpenseDialog
          hotelId={selectedHotelId}
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          onCreated={() => {
            setDialogOpen(false)
            load()
          }}
        />
      )}
    </Grid>
  )
}

export default ExpensesView
