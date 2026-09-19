import React, { useCallback, useState } from 'react'
import { View } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'

import { Badge, Button, Card, ErrorText, H1, H2, Muted, Screen } from '../../components/ui'
import { api, ApiError } from '../../libs/api'
import { useMyHotels } from '../../hooks/useMyHotels'
import type { Booking, BookingStatus } from '../../types/api'
import type { FrontDeskStackParamList } from '../../navigation/types'

type Props = NativeStackScreenProps<FrontDeskStackParamList, 'Bookings'>

const statusColor: Record<BookingStatus, string> = {
  pending: '#FF9F43',
  approved: '#00CFE8',
  active: '#28C76F',
  checked_out: '#6E6B7B',
  rejected: '#EA5455',
  cancelled: '#EA5455'
}

const FrontDeskBookingsScreen = ({ navigation }: Props) => {
  const { hotels, selectedHotelId, setSelectedHotelId } = useMyHotels()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setError(null)

    try {
      const data = await api.get<Booking[]>('/bookings')

      setBookings(data.filter(b => !selectedHotelId || b.hotel_id === selectedHotelId))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load bookings.')
    }
  }, [selectedHotelId])

  useFocusEffect(
    useCallback(() => {
      load()
    }, [load])
  )

  return (
    <Screen>
      <H1>Bookings</H1>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {hotels.map(h => (
          <Button
            key={h.id}
            title={h.name}
            variant={h.id === selectedHotelId ? 'primary' : 'outline'}
            onPress={() => setSelectedHotelId(h.id)}
            style={{ paddingHorizontal: 12 }}
          />
        ))}
      </View>

      <Button
        title='+ Register Walk-in Guest'
        onPress={() => selectedHotelId && navigation.navigate('WalkIn', { hotelId: selectedHotelId })}
        disabled={!selectedHotelId}
      />

      <ErrorText>{error}</ErrorText>

      {bookings.map(booking => (
        <Card key={booking.id}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <H2>{booking.guest?.name ?? `Guest #${booking.user_id}`}</H2>
            <Badge label={booking.status} color={statusColor[booking.status]} />
          </View>
          <Muted>
            Room {booking.room?.room_number ?? '-'} / Bed {booking.bed?.bed_number ?? '-'}
          </Muted>
        </Card>
      ))}
      {bookings.length === 0 && <Muted>No bookings yet.</Muted>}
    </Screen>
  )
}

export default FrontDeskBookingsScreen
