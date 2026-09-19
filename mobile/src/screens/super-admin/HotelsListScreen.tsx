import React, { useCallback, useState } from 'react'
import { View } from 'react-native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useFocusEffect } from '@react-navigation/native'

import { Badge, Button, Card, ErrorText, H1, H2, Muted, Screen } from '../../components/ui'
import { api, ApiError } from '../../libs/api'
import type { Hotel } from '../../types/api'
import type { SuperAdminStackParamList } from '../../navigation/types'

type Props = NativeStackScreenProps<SuperAdminStackParamList, 'Hotels'>

const HotelsListScreen = ({ navigation }: Props) => {
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await api.get<Hotel[]>('/hotels')

      setHotels(data)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load properties.')
    } finally {
      setLoading(false)
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      load()
    }, [load])
  )

  return (
    <Screen>
      <View style={{ gap: 4 }}>
        <H1>Properties</H1>
        <Muted>All hostels/hotels onboarded on the platform</Muted>
      </View>

      <Button title='+ Onboard New Property' onPress={() => navigation.navigate('CreateHotel')} />

      <ErrorText>{error}</ErrorText>

      {hotels.length === 0 && !loading && <Muted>No properties yet.</Muted>}

      {hotels.map(hotel => (
        <Card key={hotel.id}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <H2>{hotel.name}</H2>
            <Badge label={hotel.is_active ? 'Active' : 'Inactive'} color={hotel.is_active ? '#28C76F' : '#6E6B7B'} />
          </View>
          <Muted>
            {hotel.building_type} - {hotel.city ?? 'No city set'}
          </Muted>
          <Muted>Owner: {hotel.owner?.name ?? '-'}</Muted>
        </Card>
      ))}
    </Screen>
  )
}

export default HotelsListScreen
