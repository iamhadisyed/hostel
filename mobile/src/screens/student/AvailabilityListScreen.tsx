import React, { useCallback, useState } from 'react'
import { useFocusEffect } from '@react-navigation/native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'

import { Badge, Button, Card, ErrorText, H1, H2, Muted, Screen } from '../../components/ui'
import VerifyEmailBanner from '../../components/VerifyEmailBanner'
import { api, ApiError } from '../../libs/api'
import type { Hotel } from '../../types/api'
import type { StudentStackParamList } from '../../navigation/types'

type Props = NativeStackScreenProps<StudentStackParamList, 'Availability'>

const AvailabilityListScreen = ({ navigation }: Props) => {
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setError(null)

    try {
      const data = await api.get<Hotel[]>('/hotels')

      setHotels(data)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load properties.')
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      load()
    }, [load])
  )

  return (
    <Screen>
      <H1>Browse Properties</H1>
      <Muted>You can browse room and seat availability even before your email is verified.</Muted>

      <VerifyEmailBanner />

      <ErrorText>{error}</ErrorText>

      {hotels.map(hotel => (
        <Card key={hotel.id}>
          <H2>{hotel.name}</H2>
          <Muted>{hotel.city}</Muted>
          <Badge label={hotel.building_type} />
          <Button
            title='View Availability'
            variant='outline'
            onPress={() => navigation.navigate('HotelAvailability', { hotelId: hotel.id, hotelName: hotel.name })}
          />
        </Card>
      ))}
      {hotels.length === 0 && <Muted>No properties available yet.</Muted>}
    </Screen>
  )
}

export default AvailabilityListScreen
