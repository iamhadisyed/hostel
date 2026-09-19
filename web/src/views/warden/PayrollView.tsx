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
import type { Payroll, Staff } from '@/types/api'
import { useMyHotels } from '@/hooks/useMyHotels'

const PayrollView = () => {
  const { hotels, selectedHotelId, setSelectedHotelId } = useMyHotels()
  const [staffList, setStaffList] = useState<Staff[]>([])
  const [selectedStaffId, setSelectedStaffId] = useState<number | null>(null)
  const [payroll, setPayroll] = useState<Payroll[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [periodStart, setPeriodStart] = useState(new Date(new Date().setDate(1)).toISOString().slice(0, 10))
  const [periodEnd, setPeriodEnd] = useState(new Date().toISOString().slice(0, 10))
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    const load = async () => {
      if (!selectedHotelId) return

      try {
        const data = await api.get<Staff[]>(`/hotels/${selectedHotelId}/staff`)

        setStaffList(data)
        setSelectedStaffId(data[0]?.id ?? null)
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Failed to load staff.')
      }
    }

    load()
  }, [selectedHotelId])

  const loadPayroll = async () => {
    if (!selectedStaffId) return

    setLoading(true)

    try {
      const data = await api.get<Payroll[]>(`/staff/${selectedStaffId}/payroll`)

      setPayroll(data)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load payroll.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPayroll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStaffId])

  const generate = async () => {
    if (!selectedStaffId) return

    setGenerating(true)
    setError(null)

    try {
      await api.post(`/staff/${selectedStaffId}/payroll`, { period_start: periodStart, period_end: periodEnd })
      loadPayroll()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to generate payroll.')
    } finally {
      setGenerating(false)
    }
  }

  const pay = async (entry: Payroll) => {
    try {
      await api.patch(`/payroll/${entry.id}/pay`)
      loadPayroll()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to mark as paid.')
    }
  }

  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <Typography variant='h4'>Payroll</Typography>
      </Grid>

      <Grid size={{ xs: 12, sm: 4 }}>
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
      <Grid size={{ xs: 12, sm: 4 }}>
        <TextField
          select
          fullWidth
          label='Staff Member'
          value={selectedStaffId ?? ''}
          onChange={e => setSelectedStaffId(Number(e.target.value))}
        >
          {staffList.map(s => (
            <MenuItem key={s.id} value={s.id}>
              {s.name} ({s.designation})
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
          <CardHeader title='Generate Payroll' />
          <CardContent className='flex gap-4 flex-wrap items-end'>
            <TextField
              type='date'
              label='Period Start'
              value={periodStart}
              onChange={e => setPeriodStart(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              type='date'
              label='Period End'
              value={periodEnd}
              onChange={e => setPeriodEnd(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <Button variant='contained' onClick={generate} disabled={generating || !selectedStaffId}>
              {generating ? 'Generating...' : 'Generate'}
            </Button>
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12 }}>
        <Card>
          <CardHeader title='Payroll History' />
          <CardContent>
            {loading ? (
              <div className='flex justify-center p-8'>
                <CircularProgress />
              </div>
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Period</TableCell>
                    <TableCell>Gross</TableCell>
                    <TableCell>Deductions</TableCell>
                    <TableCell>Advances</TableCell>
                    <TableCell>Net</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {payroll.map(entry => (
                    <TableRow key={entry.id}>
                      <TableCell>
                        {entry.period_start} - {entry.period_end}
                      </TableCell>
                      <TableCell>Rs. {entry.gross_amount}</TableCell>
                      <TableCell>Rs. {entry.total_deductions}</TableCell>
                      <TableCell>Rs. {entry.total_advances}</TableCell>
                      <TableCell>Rs. {entry.net_amount}</TableCell>
                      <TableCell>
                        <Chip size='small' label={entry.status} color={entry.status === 'paid' ? 'success' : 'warning'} className='capitalize' />
                      </TableCell>
                      <TableCell>
                        {entry.status === 'pending' && (
                          <Button size='small' variant='contained' onClick={() => pay(entry)}>
                            Mark Paid & Generate Slip
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {payroll.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className='text-center'>
                        No payroll entries yet.
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

export default PayrollView
