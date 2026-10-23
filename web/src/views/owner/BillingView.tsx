'use client'

import { useEffect, useState } from 'react'

import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Chip from '@mui/material/Chip'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Divider from '@mui/material/Divider'

import { api, ApiError } from '@/libs/api'
import { useMyHotels } from '@/hooks/useMyHotels'
import type { BillingStatusValue, HotelBillingDetail } from '@/types/api'

const statusMeta: Record<BillingStatusValue, { label: string; color: 'default' | 'success' | 'warning' | 'error' }> = {
  no_plan: { label: 'No Plan Set', color: 'default' },
  upcoming: { label: 'Upcoming', color: 'default' },
  current: { label: 'Current', color: 'success' },
  overdue: { label: 'Overdue', color: 'error' }
}

const BillingView = () => {
  const { hotels, selectedHotelId, setSelectedHotelId } = useMyHotels()
  const [detail, setDetail] = useState<HotelBillingDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!selectedHotelId) return

    const load = async () => {
      setLoading(true)
      setError(null)

      try {
        const data = await api.get<HotelBillingDetail>(`/hotels/${selectedHotelId}/billing`)

        setDetail(data)
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Failed to load billing details.')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [selectedHotelId])

  const status = detail?.status

  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <Typography variant='h4'>Billing</Typography>
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
          <CardHeader
            title='Plan & Status'
            action={status && <Chip label={statusMeta[status.status].label} color={statusMeta[status.status].color} />}
          />
          <CardContent className='flex flex-col gap-4'>
            {loading ? (
              <div className='flex justify-center p-8'>
                <CircularProgress />
              </div>
            ) : !detail || !detail.subscription ? (
              <Typography color='text.secondary'>
                No billing plan has been set up for this property yet. Contact the platform admin.
              </Typography>
            ) : (
              <>
                {status?.status === 'overdue' && (
                  <Alert severity='error'>
                    Payment is overdue by {status.days_overdue} day{status.days_overdue === 1 ? '' : 's'} for the period
                    starting {status.current_period_start}.
                  </Alert>
                )}
                {status && !status.onboarding_paid && (
                  <Alert severity='warning'>The one-time onboarding fee has not been marked as paid yet.</Alert>
                )}

                <Grid container spacing={4}>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Typography variant='body2' color='text.secondary'>
                      Onboarding Fee
                    </Typography>
                    <Typography variant='h6'>Rs. {detail.subscription.onboarding_fee}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Typography variant='body2' color='text.secondary'>
                      Billing Cycle
                    </Typography>
                    <Typography variant='h6' className='capitalize'>
                      {detail.subscription.billing_cycle}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Typography variant='body2' color='text.secondary'>
                      Amount per {detail.subscription.billing_cycle === 'yearly' ? 'Year' : 'Month'}
                    </Typography>
                    <Typography variant='h6'>Rs. {detail.subscription.recurring_amount}</Typography>
                  </Grid>
                </Grid>

                <Divider />

                <Typography variant='h6'>Payment History</Typography>
                <Table size='small'>
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Period</TableCell>
                      <TableCell>Amount</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {detail.payments.map(p => (
                      <TableRow key={p.id}>
                        <TableCell>{p.paid_at}</TableCell>
                        <TableCell className='capitalize'>{p.type}</TableCell>
                        <TableCell>{p.period_start ?? '-'}</TableCell>
                        <TableCell>Rs. {p.amount}</TableCell>
                      </TableRow>
                    ))}
                    {detail.payments.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className='text-center'>
                          No payments recorded yet.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

export default BillingView
