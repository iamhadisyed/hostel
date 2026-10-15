'use client'

import { useEffect, useState } from 'react'

import Link from 'next/link'

import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Chip from '@mui/material/Chip'
import Button from '@mui/material/Button'

import { api, ApiError } from '@/libs/api'
import type { BillingDashboard } from '@/types/api'

const StatCard = ({ label, value, color }: { label: string; value: string | number; color?: string }) => (
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
)

const DashboardView = () => {
  const [data, setData] = useState<BillingDashboard | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get<BillingDashboard>('/super-admin/billing-dashboard')

        setData(res)
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Failed to load dashboard.')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  if (loading) {
    return (
      <div className='flex justify-center p-8'>
        <CircularProgress />
      </div>
    )
  }

  if (error) {
    return <Alert severity='error'>{error}</Alert>
  }

  if (!data) return null

  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <Typography variant='h4'>Dashboard</Typography>
      </Grid>

      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
        <StatCard label='Total Properties' value={data.summary.total_properties} />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
        <StatCard label='Active' value={data.summary.active_properties} color='success.main' />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
        <StatCard label='Inactive' value={data.summary.inactive_properties} />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
        <StatCard label='Overdue Payments' value={data.summary.overdue_count} color={data.summary.overdue_count > 0 ? 'error.main' : undefined} />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
        <StatCard label='Upcoming Dues' value={data.summary.upcoming_count} />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
        <StatCard label='Est. Monthly Revenue' value={`Rs. ${data.summary.estimated_monthly_revenue.toLocaleString()}`} />
      </Grid>

      <Grid size={{ xs: 12 }}>
        <Card>
          <CardHeader
            title='Overdue Properties'
            subheader='Payment is past due for the current billing period - call to follow up'
          />
          <CardContent>
            <Table size='small'>
              <TableHead>
                <TableRow>
                  <TableCell>Property</TableCell>
                  <TableCell>Owner</TableCell>
                  <TableCell>Contact</TableCell>
                  <TableCell>Days Overdue</TableCell>
                  <TableCell>Period Start</TableCell>
                  <TableCell align='right'>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.overdue.map(row => (
                  <TableRow key={row.hotel.id}>
                    <TableCell>{row.hotel.name}</TableCell>
                    <TableCell>{row.hotel.owner?.name ?? '-'}</TableCell>
                    <TableCell>{row.hotel.owner?.phone ?? row.hotel.owner?.email ?? '-'}</TableCell>
                    <TableCell>
                      <Chip size='small' color='error' label={`${row.billing.days_overdue} day(s)`} />
                    </TableCell>
                    <TableCell>{row.billing.current_period_start}</TableCell>
                    <TableCell align='right'>
                      <Button size='small' component={Link} href='/super-admin/hotels'>
                        Open Billing
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {data.overdue.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className='text-center'>
                      Nothing overdue right now.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12 }}>
        <Card>
          <CardHeader title='Upcoming First Bills' subheader="Properties whose billing hasn't started yet" />
          <CardContent>
            <Table size='small'>
              <TableHead>
                <TableRow>
                  <TableCell>Property</TableCell>
                  <TableCell>Owner</TableCell>
                  <TableCell>First Billing Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.upcoming.map(row => (
                  <TableRow key={row.hotel.id}>
                    <TableCell>{row.hotel.name}</TableCell>
                    <TableCell>{row.hotel.owner?.name ?? '-'}</TableCell>
                    <TableCell>{row.billing.current_period_start}</TableCell>
                  </TableRow>
                ))}
                {data.upcoming.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className='text-center'>
                      Nothing upcoming.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

export default DashboardView
