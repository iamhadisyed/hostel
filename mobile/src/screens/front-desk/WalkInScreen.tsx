import React, { useEffect, useState } from 'react'
import { View } from 'react-native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'

import { Badge, Button, Card, ErrorText, Field, H1, H2, InfoText, Muted, Screen } from '../../components/ui'
import { api, ApiError } from '../../libs/api'
import type { AvailabilityRoomType } from '../../types/api'
import type { FrontDeskStackParamList } from '../../navigation/types'

type Props = NativeStackScreenProps<FrontDeskStackParamList, 'WalkIn'>

const WalkInScreen = ({ route, navigation }: Props) => {
  const { hotelId } = route.params
  const [roomTypes, setRoomTypes] = useState<AvailabilityRoomType[]>([])
  const [selectedBedId, setSelectedBedId] = useState<number | null>(null)
  const [guestName, setGuestName] = useState('')
  const [guestPhone, setGuestPhone] = useState('')
  const [guestCnic, setGuestCnic] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

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

  const selectedRoomType = roomTypes.find(rt => rt.rooms.some(r => r.beds.some(b => b.id === selectedBedId)))

  const handleSubmit = async () => {
    if (!selectedBedId || !selectedRoomType) return

    setSubmitting(true)
    setError(null)

    try {
      await api.post('/bookings/walk-in', {
        hotel_id: hotelId,
        room_type_id: selectedRoomType.id,
        bed_id: selectedBedId,
        guest: { name: guestName, phone: guestPhone, cnic: guestCnic }
      })
      navigation.goBack()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create booking.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Screen>
      <H1>Register Walk-in Guest</H1>
      <InfoText>In-person CNIC verification substitutes for email OTP. Warden/Owner approval is still required.</InfoText>

      <ErrorText>{error}</ErrorText>

      <Field label='Guest Name' value={guestName} onChangeText={setGuestName} />
      <Field label='Phone' value={guestPhone} onChangeText={setGuestPhone} keyboardType='phone-pad' />
      <Field label='CNIC / B-Form' value={guestCnic} onChangeText={setGuestCnic} />

      <H2>Select a Bed</H2>
      {roomTypes.map(rt => (
        <Card key={rt.id}>
          <Muted>
            {rt.name} - Rs. {rt.monthly_price}/mo - {rt.available_beds} available
          </Muted>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {rt.rooms.flatMap(room =>
              room.beds
                .filter(bed => bed.status === 'available')
                .map(bed => (
                  <Badge
                    key={bed.id}
                    label={`Room ${room.room_number} / Bed ${bed.bed_number}${selectedBedId === bed.id ? ' *' : ''}`}
                    color={selectedBedId === bed.id ? '#28C76F' : '#6E6B7B'}
                  />
                ))
            )}
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {rt.rooms.flatMap(room =>
              room.beds
                .filter(bed => bed.status === 'available')
                .map(bed => (
                  <Button
                    key={bed.id}
                    title={`R${room.room_number}-${bed.bed_number}`}
                    variant={selectedBedId === bed.id ? 'primary' : 'outline'}
                    onPress={() => setSelectedBedId(bed.id)}
                    style={{ paddingHorizontal: 10 }}
                  />
                ))
            )}
          </View>
        </Card>
      ))}

      <Button title='Register & Book' onPress={handleSubmit} loading={submitting} disabled={!selectedBedId || !guestName} />
    </Screen>
  )
}

export default WalkInScreen
