'use client'

import { useEffect, useState } from 'react'

import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import Alert from '@mui/material/Alert'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'

import { api, ApiError } from '@/libs/api'
import type { BillingStatusValue, Hotel, HotelBillingDetail, HotelBillingPaymentType } from '@/types/api'

const todayStr = () => new Date().toISOString().slice(0, 10)

const statusMeta: Record<BillingStatusValue, { label: string; color: 'default' | 'success' | 'warning' | 'error' }> = {
  no_plan: { label: 'No Plan Set', color: 'default' },
  upcoming: { label: 'Upcoming', color: 'default' },
  current: { label: 'Current', color: 'success' },
  overdue: { label: 'Overdue', color: 'error' }
}

const BillingDialog = ({ hotel, open, onClose }: { hotel: Hotel | null; open: boolean; onClose: () => void }) => {
  const [detail, setDetail] = useState<HotelBillingDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [onboardingFee, setOnboardingFee] = useState(0)
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
  const [recurringAmount, setRecurringAmount] = useState(0)
  const [billingAnchorDate, setBillingAnchorDate] = useState(todayStr())

  const [paymentType, setPaymentType] = useState<HotelBillingPaymentType>('recurring')
  const [paymentAmount, setPaymentAmount] = useState(0)
  const [paymentPaidAt, setPaymentPaidAt] = useState(todayStr())
  const [paymentPeriodStart, setPaymentPeriodStart] = useState('')
  const [paymentNote, setPaymentNote] = useState('')

  const load = async () => {
    if (!hotel) return

    setLoading(true)
    setError(null)

    try {
      const data = await api.get<HotelBillingDetail>(`/hotels/${hotel.id}/billing`)

      setDetail(data)

      if (data.subscription) {
        setOnboardingFee(Number(data.subscription.onboarding_fee))
        setBillingCycle(data.subscription.billing_cycle)
        setRecurringAmount(Number(data.subscription.recurring_amount))
        setBillingAnchorDate(data.subscription.billing_anchor_date.slice(0, 10))
      }

      if (data.status.current_period_start) {
        setPaymentPeriodStart(data.status.current_period_start)
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load billing details.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, hotel?.id])

  const saveTerms = async () => {
    if (!hotel) return

    setSaving(true)
    setError(null)

    try {
      await api.put(`/hotels/${hotel.id}/billing`, {
        onboarding_fee: onboardingFee,
        billing_cycle: billingCycle,
        recurring_amount: recurringAmount,
        billing_anchor_date: billingAnchorDate
      })
      await load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save billing terms.')
    } finally {
      setSaving(false)
    }
  }

  const recordPayment = async () => {
    if (!hotel) return

    setSaving(true)
    setError(null)

    try {
      await api.post(`/hotels/${hotel.id}/billing/payments`, {
        type: paymentType,
        amount: paymentAmount,
        paid_at: paymentPaidAt,
        period_start: paymentType === 'recurring' ? paymentPeriodStart : undefined,
        note: paymentNote || undefined
      })
      setPaymentAmount(0)
      setPaymentNote('')
      await load()
    } catch (err) {
      if (err instanceof ApiError && err.errors) {
        setError(Object.values(err.errors).flat().join(' '))
      } else {
        setError(err instanceof ApiError ? err.message : 'Failed to record payment.')
      }
    } finally {
      setSaving(false)
    }
  }

  const status = detail?.status

  return (
    <Dialog open={open} onClose={onClose} maxWidth='md' fullWidth>
      <DialogTitle className='flex items-center justify-between gap-4'>
        <span>Billing - {hotel?.name}</span>
        {status && <Chip size='small' label={statusMeta[status.status].label} color={statusMeta[status.status].color} />}
      </DialogTitle>
      <DialogContent dividers className='flex flex-col gap-6'>
        {error && <Alert severity='error'>{error}</Alert>}

        {loading ? (
          <div className='flex justify-center p-8'>
            <CircularProgress />
          </div>
        ) : (
          <>
            {status?.status === 'overdue' && (
              <Alert severity='error'>
                Payment is overdue by {status.days_overdue} day{status.days_overdue === 1 ? '' : 's'} for the period
                starting {status.current_period_start}. Consider calling the owner to follow up.
              </Alert>
            )}
            {status && !status.onboarding_paid && (
              <Alert severity='warning'>The one-time onboarding fee has not been marked as paid yet.</Alert>
            )}

            <Typography variant='h6'>Plan Terms</Typography>
            <Grid container spacing={4}>
              <Grid size={{ xs: 12, sm: 3 }}>
                <TextField
                  fullWidth
                  type='number'
                  label='Onboarding Fee'
                  value={onboardingFee}
                  onChange={e => setOnboardingFee(Number(e.target.value))}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 3 }}>
                <TextField
                  select
                  fullWidth
                  label='Billing Cycle'
                  value={billingCycle}
                  onChange={e => setBillingCycle(e.target.value as typeof billingCycle)}
                >
                  <MenuItem value='monthly'>Monthly</MenuItem>
                  <MenuItem value='yearly'>Yearly</MenuItem>
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 3 }}>
                <TextField
                  fullWidth
                  type='number'
                  label={`Amount / ${billingCycle === 'yearly' ? 'year' : 'month'}`}
                  value={recurringAmount}
                  onChange={e => setRecurringAmount(Number(e.target.value))}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 3 }}>
                <TextField
                  fullWidth
                  type='date'
                  label='Billing Start Date'
                  InputLabelProps={{ shrink: true }}
                  value={billingAnchorDate}
                  onChange={e => setBillingAnchorDate(e.target.value)}
                />
              </Grid>
            </Grid>
            <Button variant='outlined' onClick={saveTerms} disabled={saving} className='self-start'>
              Save Plan Terms
            </Button>

            <Divider />
            <Typography variant='h6'>Record a Payment</Typography>
            <Grid container spacing={4}>
              <Grid size={{ xs: 12, sm: 3 }}>
                <TextField
                  select
                  fullWidth
                  label='Type'
                  value={paymentType}
                  onChange={e => setPaymentType(e.target.value as HotelBillingPaymentType)}
                >
                  <MenuItem value='recurring'>Recurring</MenuItem>
                  <MenuItem value='onboarding'>Onboarding Fee</MenuItem>
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 3 }}>
                <TextField
                  fullWidth
                  type='number'
                  label='Amount Received'
                  value={paymentAmount}
                  onChange={e => setPaymentAmount(Number(e.target.value))}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 3 }}>
                <TextField
                  fullWidth
                  type='date'
                  label='Date Received'
                  InputLabelProps={{ shrink: true }}
                  value={paymentPaidAt}
                  onChange={e => setPaymentPaidAt(e.target.value)}
                />
              </Grid>
              {paymentType === 'recurring' && (
                <Grid size={{ xs: 12, sm: 3 }}>
                  <TextField
                    fullWidth
                    type='date'
                    label='For Period Starting'
                    InputLabelProps={{ shrink: true }}
                    value={paymentPeriodStart}
                    onChange={e => setPaymentPeriodStart(e.target.value)}
                    helperText={status?.current_period_start ? `Current period: ${status.current_period_start}` : undefined}
                  />
                </Grid>
              )}
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label='Note (optional)'
                  value={paymentNote}
                  onChange={e => setPaymentNote(e.target.value)}
                />
              </Grid>
            </Grid>
            <Button variant='contained' onClick={recordPayment} disabled={saving} className='self-start'>
              Record Payment
            </Button>

            <Divider />
            <Typography variant='h6'>Payment History</Typography>
            <Table size='small'>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Period</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Note</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {detail?.payments.map(p => (
                  <TableRow key={p.id}>
                    <TableCell>{p.paid_at}</TableCell>
                    <TableCell className='capitalize'>{p.type}</TableCell>
                    <TableCell>{p.period_start ?? '-'}</TableCell>
                    <TableCell>Rs. {p.amount}</TableCell>
                    <TableCell>{p.note ?? '-'}</TableCell>
                  </TableRow>
                ))}
                {(!detail || detail.payments.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={5} className='text-center'>
                      No payments recorded yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  )
}

export default BillingDialog
