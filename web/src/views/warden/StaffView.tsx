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
import type { Staff } from '@/types/api'
import { useMyHotels } from '@/hooks/useMyHotels'

const StaffView = () => {
  const { hotels, selectedHotelId, setSelectedHotelId } = useMyHotels()
  const [staff, setStaff] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [attendanceStaff, setAttendanceStaff] = useState<Staff | null>(null)
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().slice(0, 10))
  const [attendanceStatus, setAttendanceStatus] = useState('present')

  const [form, setForm] = useState({ name: '', designation: '', wage_type: 'daily', rate: '' })
  const [submitting, setSubmitting] = useState(false)

  const load = async () => {
    if (!selectedHotelId) return

    setLoading(true)
    setError(null)

    try {
      const data = await api.get<Staff[]>(`/hotels/${selectedHotelId}/staff`)

      setStaff(data)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load staff.')
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
      await api.post(`/hotels/${selectedHotelId}/staff`, { ...form, rate: Number(form.rate) })
      setDialogOpen(false)
      setForm({ name: '', designation: '', wage_type: 'daily', rate: '' })
      load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to add staff.')
    } finally {
      setSubmitting(false)
    }
  }

  const deactivate = async (member: Staff) => {
    if (!selectedHotelId) return

    try {
      await api.delete(`/hotels/${selectedHotelId}/staff/${member.id}`)
      load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to deactivate.')
    }
  }

  const markAttendance = async () => {
    if (!attendanceStaff) return

    try {
      await api.post(`/staff/${attendanceStaff.id}/attendance`, { date: attendanceDate, status: attendanceStatus })
      setAttendanceStaff(null)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to mark attendance.')
    }
  }

  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }} className='flex items-center justify-between'>
        <Typography variant='h4'>Staff</Typography>
        <Button variant='contained' onClick={() => setDialogOpen(true)} disabled={!selectedHotelId}>
          + Add Staff
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
          <CardHeader title='Staff Directory' />
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
                    <TableCell>Designation</TableCell>
                    <TableCell>Wage Type</TableCell>
                    <TableCell>Rate</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {staff.map(member => (
                    <TableRow key={member.id}>
                      <TableCell>{member.name}</TableCell>
                      <TableCell>{member.designation}</TableCell>
                      <TableCell className='capitalize'>{member.wage_type}</TableCell>
                      <TableCell>Rs. {member.rate}</TableCell>
                      <TableCell>
                        <Chip
                          size='small'
                          label={member.is_active ? 'Active' : 'Inactive'}
                          color={member.is_active ? 'success' : 'default'}
                        />
                      </TableCell>
                      <TableCell>
                        <div className='flex gap-2'>
                          {member.wage_type === 'daily' && (
                            <Button size='small' onClick={() => setAttendanceStaff(member)}>
                              Mark Attendance
                            </Button>
                          )}
                          {member.is_active && (
                            <Button size='small' color='error' onClick={() => deactivate(member)}>
                              Deactivate
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {staff.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className='text-center'>
                        No staff yet.
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
        <DialogTitle>Add Staff</DialogTitle>
        <DialogContent className='flex flex-col gap-4 pbs-4'>
          <TextField fullWidth label='Name' value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          <TextField
            fullWidth
            label='Designation'
            value={form.designation}
            onChange={e => setForm({ ...form, designation: e.target.value })}
          />
          <TextField
            select
            fullWidth
            label='Wage Type'
            value={form.wage_type}
            onChange={e => setForm({ ...form, wage_type: e.target.value })}
          >
            <MenuItem value='daily'>Daily</MenuItem>
            <MenuItem value='monthly'>Monthly</MenuItem>
          </TextField>
          <TextField
            fullWidth
            type='number'
            label={form.wage_type === 'daily' ? 'Daily Rate' : 'Monthly Salary'}
            value={form.rate}
            onChange={e => setForm({ ...form, rate: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant='contained' onClick={handleCreate} disabled={submitting}>
            {submitting ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!attendanceStaff} onClose={() => setAttendanceStaff(null)} maxWidth='xs' fullWidth>
        <DialogTitle>Mark Attendance - {attendanceStaff?.name}</DialogTitle>
        <DialogContent className='flex flex-col gap-4 pbs-4'>
          <TextField
            fullWidth
            type='date'
            label='Date'
            value={attendanceDate}
            onChange={e => setAttendanceDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            select
            fullWidth
            label='Status'
            value={attendanceStatus}
            onChange={e => setAttendanceStatus(e.target.value)}
          >
            <MenuItem value='present'>Present</MenuItem>
            <MenuItem value='absent'>Absent</MenuItem>
            <MenuItem value='half_day'>Half Day</MenuItem>
            <MenuItem value='leave'>Leave</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAttendanceStaff(null)}>Cancel</Button>
          <Button variant='contained' onClick={markAttendance}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  )
}

export default StaffView
