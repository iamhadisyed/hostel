import React, { useCallback, useState } from 'react'
import { View } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'

import { Badge, Button, Card, ErrorText, H1, H2, Muted, Screen } from '../../components/ui'
import { api, ApiError } from '../../libs/api'
import type { Booking, BookingStatus } from '../../types/api'

const statusColor: Record<BookingStatus, string> = {
  pending: '#FF9F43',
  approved: '#00CFE8',
  active: '#28C76F',
  checked_out: '#6E6B7B',
  rejected: '#EA5455',
  cancelled: '#EA5455'
}

const BookingCard = ({ booking, onChanged }: { booking: Booking; onChanged: () => void }) => {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const act = async (fn: () => Promise<unknown>) => {
    setBusy(true)
    setError(null)

    try {
      await fn()
      onChanged()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Action failed.')
    } finally {
      setBusy(false)
    }
  }

  const pendingPayment = booking.cycles?.[booking.cycles.length - 1]?.voucher?.payments?.find(p => p.status === 'pending')
  const latestCycle = booking.cycles?.[booking.cycles.length - 1]

  return (
    <Card>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <H2>{booking.guest?.name ?? `Guest #${booking.user_id}`}</H2>
        <Badge label={booking.status} color={statusColor[booking.status]} />
      </View>
      <Muted>
        Room {booking.room?.room_number ?? '-'} / Bed {booking.bed?.bed_number ?? '-'} - via {booking.created_by.replace('_', ' ')}
      </Muted>

      {latestCycle && (
        <Muted>
          Cycle: {latestCycle.period_start} to {latestCycle.period_end} - Rs. {latestCycle.amount} - Voucher{' '}
          {latestCycle.voucher?.status}
        </Muted>
      )}

      <ErrorText>{error}</ErrorText>

      {booking.status === 'pending' && (
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Button
            title='Approve'
            variant='success'
            onPress={() => act(() => api.patch(`/bookings/${booking.id}/approve`))}
            loading={busy}
            style={{ flex: 1 }}
          />
          <Button
            title='Reject'
            variant='danger'
            onPress={() => act(() => api.patch(`/bookings/${booking.id}/reject`, {}))}
            loading={busy}
            style={{ flex: 1 }}
          />
        </View>
      )}

      {pendingPayment && (
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Button
            title='Verify Payment'
            variant='success'
            onPress={() => act(() => api.patch(`/payments/${pendingPayment.id}/verify`, { decision: 'approved' }))}
            loading={busy}
            style={{ flex: 1 }}
          />
          <Button
            title='Reject Payment'
            variant='danger'
            onPress={() => act(() => api.patch(`/payments/${pendingPayment.id}/verify`, { decision: 'rejected' }))}
            loading={busy}
            style={{ flex: 1 }}
          />
        </View>
      )}

      {booking.status === 'active' && (
        <Button title='Checkout' onPress={() => act(() => api.patch(`/bookings/${booking.id}/checkout`))} loading={busy} />
      )}
    </Card>
  )
}

const BookingsScreen = () => {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setError(null)

    try {
      const list = await api.get<Booking[]>('/bookings')
      const withDetails = await Promise.all(list.map(b => api.get<Booking>(`/bookings/${b.id}`).catch(() => b)))

      setBookings(withDetails)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load bookings.')
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      load()
    }, [load])
  )

  return (
    <Screen>
      <H1>Bookings</H1>
      <ErrorText>{error}</ErrorText>
      {bookings.map(booking => (
        <BookingCard key={booking.id} booking={booking} onChanged={load} />
      ))}
      {bookings.length === 0 && <Muted>No bookings yet.</Muted>}
    </Screen>
  )
}

export default BookingsScreen
