import React, { useCallback, useState } from 'react'
import { Alert, View } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'

import { Badge, Button, Card, ErrorText, H1, H2, Muted, Screen } from '../../components/ui'
import VerifyEmailBanner from '../../components/VerifyEmailBanner'
import { api, ApiError } from '../../libs/api'
import { appendFileToFormData, pickImageFile } from '../../libs/upload'
import type { Booking, Document } from '../../types/api'

const DOC_TYPES: { type: Document['type']; label: string }[] = [
  { type: 'cnic_front', label: 'CNIC Front (or B-Form)' },
  { type: 'cnic_back', label: 'CNIC Back' },
  { type: 'face_photo', label: 'Face Photo' }
]

const MyBookingScreen = () => {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [error, setError] = useState<string | null>(null)
  const [uploadingType, setUploadingType] = useState<string | null>(null)
  const [proofBusy, setProofBusy] = useState(false)

  const load = useCallback(async () => {
    setError(null)

    try {
      const [bookingList, docs] = await Promise.all([api.get<Booking[]>('/bookings'), api.get<Document[]>('/documents')])
      const withDetails = await Promise.all(bookingList.map(b => api.get<Booking>(`/bookings/${b.id}`).catch(() => b)))

      setBookings(withDetails)
      setDocuments(docs)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load your booking.')
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      load()
    }, [load])
  )

  const uploadDoc = async (type: string) => {
    const file = await pickImageFile()

    if (!file) return

    setUploadingType(type)

    const formData = new FormData()

    formData.append('type', type)
    appendFileToFormData(formData, 'file', file)

    try {
      await api.postForm('/documents', formData)
      load()
    } catch (err) {
      Alert.alert('Error', err instanceof ApiError ? err.message : 'Failed to upload document.')
    } finally {
      setUploadingType(null)
    }
  }

  const uploadProof = async (voucherId: number) => {
    const file = await pickImageFile()

    if (!file) return

    setProofBusy(true)

    const formData = new FormData()

    appendFileToFormData(formData, 'file', file)

    try {
      await api.postForm(`/vouchers/${voucherId}/payments`, formData)
      load()
    } catch (err) {
      Alert.alert('Error', err instanceof ApiError ? err.message : 'Failed to upload payment proof.')
    } finally {
      setProofBusy(false)
    }
  }

  return (
    <Screen>
      <H1>My Booking</H1>
      <ErrorText>{error}</ErrorText>

      <VerifyEmailBanner />

      <Card>
        <H2>Identity Documents</H2>
        {DOC_TYPES.map(({ type, label }) => {
          const uploaded = documents.find(d => d.type === type)

          return (
            <View key={type} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Muted>{label}</Muted>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Badge label={uploaded ? 'Uploaded' : 'Missing'} color={uploaded ? '#28C76F' : '#6E6B7B'} />
                <Button
                  title={uploaded ? 'Replace' : 'Upload'}
                  variant='outline'
                  onPress={() => uploadDoc(type)}
                  loading={uploadingType === type}
                  style={{ paddingHorizontal: 10 }}
                />
              </View>
            </View>
          )
        })}
      </Card>

      {bookings.length === 0 && <Muted>You have no bookings yet. Browse availability to submit a request.</Muted>}

      {bookings.map(booking => (
        <Card key={booking.id}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <H2>
              Room {booking.room?.room_number ?? '-'} / Bed {booking.bed?.bed_number ?? '-'}
            </H2>
            <Badge label={booking.status} color={booking.status === 'active' ? '#28C76F' : '#6E6B7B'} />
          </View>

          {booking.cycles?.map(cycle => (
            <View key={cycle.id} style={{ gap: 4, paddingVertical: 4 }}>
              <Muted>
                {cycle.period_start} to {cycle.period_end} - Rs. {cycle.amount} - {cycle.voucher?.status}
              </Muted>
              {cycle.voucher?.status === 'pending' && (
                <Button
                  title='Upload Payment Proof'
                  onPress={() => uploadProof(cycle.voucher!.id)}
                  loading={proofBusy}
                />
              )}
            </View>
          ))}
          {!booking.cycles?.length && <Muted>Awaiting Warden/Owner approval.</Muted>}
        </Card>
      ))}
    </Screen>
  )
}

export default MyBookingScreen
