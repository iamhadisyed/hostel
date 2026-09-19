import React, { useEffect, useState } from 'react'
import { Alert, View } from 'react-native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'

import { Badge, Button, Card, ErrorText, H1, Muted, Screen } from '../../components/ui'
import { api, ApiError } from '../../libs/api'
import { useAuth } from '../../contexts/AuthContext'
import type { AvailabilityRoomType } from '../../types/api'
import type { StudentStackParamList } from '../../navigation/types'

type Props = NativeStackScreenProps<StudentStackParamList, 'HotelAvailability'>

const HotelAvailabilityScreen = ({ route }: Props) => {
  const { hotelId, hotelName } = route.params
  const { user } = useAuth()
  const [roomTypes, setRoomTypes] = useState<AvailabilityRoomType[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.get<{ room_types: AvailabilityRoomType[] }>(`/hotels/${hotelId}/availability`, false)

        setRoomTypes(data.room_types)
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Failed to load availability.')
      }
    }

    load()
  }, [hotelId])

  const requestBed = async (roomTypeId: number, bedId: number) => {
    try {
      await api.post('/bookings', { hotel_id: hotelId, room_type_id: roomTypeId, bed_id: bedId })

      const reminder = user?.email_verified_at
        ? ''
        : ' Verify your email from the My Booking tab so a voucher can be generated once approved.'

      Alert.alert('Request submitted', `Track its status on the My Booking tab.${reminder}`)
    } catch (err) {
      Alert.alert('Error', err instanceof ApiError ? err.message : 'Failed to submit booking request.')
    }
  }

  return (
    <Screen>
      <H1>{hotelName}</H1>
      <ErrorText>{error}</ErrorText>

      {roomTypes.map(rt => (
        <Card key={rt.id}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Muted>{rt.name}</Muted>
            <Muted>Rs. {rt.monthly_price}/mo</Muted>
          </View>
          <Muted>
            {rt.available_beds} of {rt.total_beds} beds available
          </Muted>
          {rt.rooms.map(room => (
            <View key={room.id} style={{ gap: 6 }}>
              <Muted>Room {room.room_number}</Muted>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {room.beds.map(bed => (
                  <View key={bed.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Badge label={bed.bed_number} color={bed.status === 'available' ? '#28C76F' : '#6E6B7B'} />
                    {bed.status === 'available' && (
                      <Button title='Request' variant='outline' onPress={() => requestBed(rt.id, bed.id)} style={{ paddingHorizontal: 8 }} />
                    )}
                  </View>
                ))}
              </View>
            </View>
          ))}
        </Card>
      ))}
    </Screen>
  )
}

export default HotelAvailabilityScreen
