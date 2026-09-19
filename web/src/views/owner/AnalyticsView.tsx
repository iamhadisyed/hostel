'use client'

import { useEffect, useState } from 'react'

import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'

import { api, ApiError } from '@/libs/api'
import type { AnalyticsSummary } from '@/types/api'
import { useMyHotels } from '@/hooks/useMyHotels'

const StatCard = ({ label, value, color }: { label: string; value: string; color?: string }) => (
  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
    <Card>
      <CardContent>
        <Typography variant='body2' color='text.secondary'>
          {label}
        </Typography>
        <Typography variant='h4' color={color}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  </Grid>
)

const startOfMonth = () => new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10)
const endOfMonth = () => new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().slice(0, 10)

const AnalyticsView = () => {
  const { hotels, selectedHotelId, setSelectedHotelId } = useMyHotels()
  const [from, setFrom] = useState(startOfMonth())
  const [to, setTo] = useState(endOfMonth())
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [scope, setScope] = useState<'all' | number>('all')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams({ from, to })

        if (scope !== 'all') params.set('hotel_id', String(scope))

        const data = await api.get<AnalyticsSummary>(`/analytics/summary?${params.toString()}`)

        setSummary(data)
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Failed to load analytics.')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [from, to, scope])

  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <Typography variant='h4'>Analytics</Typography>
      </Grid>

      <Grid size={{ xs: 12, sm: 4 }}>
        <TextField select fullWidth label='Property' value={scope} onChange={e => setScope(e.target.value === 'all' ? 'all' : Number(e.target.value))}>
          <MenuItem value='all'>All my properties</MenuItem>
          {hotels.map(h => (
            <MenuItem key={h.id} value={h.id}>
              {h.name}
            </MenuItem>
          ))}
        </TextField>
      </Grid>
      <Grid size={{ xs: 6, sm: 4 }}>
        <TextField fullWidth type='date' label='From' value={from} onChange={e => setFrom(e.target.value)} InputLabelProps={{ shrink: true }} />
      </Grid>
      <Grid size={{ xs: 6, sm: 4 }}>
        <TextField fullWidth type='date' label='To' value={to} onChange={e => setTo(e.target.value)} InputLabelProps={{ shrink: true }} />
      </Grid>

      {error && (
        <Grid size={{ xs: 12 }}>
          <Alert severity='error'>{error}</Alert>
        </Grid>
      )}

      {loading ? (
        <Grid size={{ xs: 12 }} className='flex justify-center p-8'>
          <CircularProgress />
        </Grid>
      ) : summary ? (
        <>
          <StatCard label='Revenue' value={`Rs. ${summary.revenue.toLocaleString()}`} color='success.main' />
          <StatCard label='Payroll Burn' value={`Rs. ${summary.payroll_total.toLocaleString()}`} />
          <StatCard label='Expenses' value={`Rs. ${summary.expenses_total.toLocaleString()}`} />
          <StatCard
            label='Net Savings'
            value={`Rs. ${summary.net_savings.toLocaleString()}`}
            color={summary.net_savings >= 0 ? 'success.main' : 'error.main'}
          />
          <StatCard label='Occupancy Rate' value={summary.occupancy_rate !== null ? `${summary.occupancy_rate}%` : '-'} />
          <StatCard label='Avg. Stay Duration' value={summary.average_stay_days !== null ? `${summary.average_stay_days} days` : '-'} />

          <Grid size={{ xs: 12 }}>
            <Card>
              <CardContent>
                <Typography variant='h6' className='mbe-4'>
                  Pricing Performance by Room Type
                </Typography>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Room Type</TableCell>
                      <TableCell>Monthly Price</TableCell>
                      <TableCell>Occupied / Total Beds</TableCell>
                      <TableCell>Occupancy</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {summary.pricing_performance.map((rt, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{rt.room_type}</TableCell>
                        <TableCell>Rs. {rt.monthly_price}</TableCell>
                        <TableCell>
                          {rt.occupied_beds} / {rt.total_beds}
                        </TableCell>
                        <TableCell>
                          {rt.total_beds > 0 ? `${Math.round((rt.occupied_beds / rt.total_beds) * 100)}%` : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </Grid>
        </>
      ) : null}
    </Grid>
  )
}

export default AnalyticsView
