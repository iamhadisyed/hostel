'use client'

import { useEffect, useState } from 'react'

import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'
import Chip from '@mui/material/Chip'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'

import { api, ApiError } from '@/libs/api'
import type { Booking, Document } from '@/types/api'
import { useAuth } from '@/contexts/AuthContext'

const DOC_TYPES: { type: Document['type']; label: string }[] = [
  { type: 'cnic_front', label: 'CNIC Front (or B-Form)' },
  { type: 'cnic_back', label: 'CNIC Back' },
  { type: 'face_photo', label: 'Face Photo' }
]

const MyBookingView = () => {
  const { user } = useAuth()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [uploadingType, setUploadingType] = useState<string | null>(null)
  const [proofBusy, setProofBusy] = useState(false)

  const load = async () => {
    setLoading(true)
    setError(null)

    try {
      const [bookingList, docs] = await Promise.all([
        api.get<Booking[]>('/bookings'),
        api.get<Document[]>('/documents')
      ])

      const withDetails = await Promise.all(bookingList.map(b => api.get<Booking>(`/bookings/${b.id}`).catch(() => b)))

      setBookings(withDetails)
      setDocuments(docs)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load your booking.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const uploadDoc = async (type: string, file: File | null) => {
    if (!file) return

    setUploadingType(type)
    setError(null)

    const formData = new FormData()

    formData.append('type', type)
    formData.append('file', file)

    try {
      await api.postForm('/documents', formData)
      load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to upload document.')
    } finally {
      setUploadingType(null)
    }
  }

  const uploadProof = async (voucherId: number, file: File | null) => {
    if (!file) return

    setProofBusy(true)
    setError(null)

    const formData = new FormData()

    formData.append('file', file)

    try {
      await api.postForm(`/vouchers/${voucherId}/payments`, formData)
      load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to upload payment proof.')
    } finally {
      setProofBusy(false)
    }
  }

  if (loading) {
    return (
      <div className='flex justify-center p-8'>
        <CircularProgress />
      </div>
    )
  }

  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <Typography variant='h4'>My Booking</Typography>
      </Grid>

      {error && (
        <Grid size={{ xs: 12 }}>
          <Alert severity='error'>{error}</Alert>
        </Grid>
      )}

      {!user?.email_verified_at && (
        <Grid size={{ xs: 12 }}>
          <Alert severity='warning'>
            Your email is not verified yet. You can browse availability, but a voucher won&apos;t be generated until
            you verify your email on the Verify Email page.
          </Alert>
        </Grid>
      )}

      <Grid size={{ xs: 12 }}>
        <Card>
          <CardHeader title='Identity Documents' />
          <CardContent className='flex flex-col gap-3'>
            {DOC_TYPES.map(({ type, label }) => {
              const uploaded = documents.find(d => d.type === type)

              return (
                <div key={type} className='flex items-center gap-3'>
                  <Typography className='is-64'>{label}</Typography>
                  {uploaded ? (
                    <Chip size='small' color='success' label='Uploaded' />
                  ) : (
                    <Chip size='small' label='Missing' />
                  )}
                  <Button component='label' size='small' disabled={uploadingType === type}>
                    {uploadingType === type ? 'Uploading...' : uploaded ? 'Replace' : 'Upload'}
                    <input
                      hidden
                      type='file'
                      accept='.jpg,.jpeg,.png,.pdf'
                      onChange={e => uploadDoc(type, e.target.files?.[0] ?? null)}
                    />
                  </Button>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </Grid>

      {bookings.length === 0 && (
        <Grid size={{ xs: 12 }}>
          <Alert severity='info'>You have no bookings yet. Browse availability to submit a request.</Alert>
        </Grid>
      )}

      {bookings.map(booking => (
        <Grid size={{ xs: 12 }} key={booking.id}>
          <Card>
            <CardHeader
              title={`Room ${booking.room?.room_number ?? '-'} / Bed ${booking.bed?.bed_number ?? '-'}`}
              action={<Chip label={booking.status} className='capitalize' color={booking.status === 'active' ? 'success' : 'default'} />}
            />
            <CardContent>
              <Table size='small'>
                <TableHead>
                  <TableRow>
                    <TableCell>Period</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Voucher</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {booking.cycles?.map(cycle => (
                    <TableRow key={cycle.id}>
                      <TableCell>
                        {cycle.period_start} - {cycle.period_end}
                      </TableCell>
                      <TableCell>Rs. {cycle.amount}</TableCell>
                      <TableCell>{cycle.voucher?.voucher_number}</TableCell>
                      <TableCell className='capitalize'>{cycle.voucher?.status}</TableCell>
                      <TableCell>
                        {cycle.voucher?.status === 'pending' && cycle.voucher && (
                          <Button component='label' size='small' variant='contained' disabled={proofBusy}>
                            Upload Payment Proof
                            <input
                              hidden
                              type='file'
                              accept='.jpg,.jpeg,.png,.pdf'
                              onChange={e => uploadProof(cycle.voucher!.id, e.target.files?.[0] ?? null)}
                            />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {!booking.cycles?.length && (
                    <TableRow>
                      <TableCell colSpan={5} className='text-center'>
                        Awaiting Warden/Owner approval.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  )
}

export default MyBookingView
