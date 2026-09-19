import React, { useState } from 'react'
import { View } from 'react-native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'

import { Button, Card, ErrorText, Field, H2, Muted, Screen } from '../../components/ui'
import { api, ApiError } from '../../libs/api'
import type { SuperAdminStackParamList } from '../../navigation/types'

type Props = NativeStackScreenProps<SuperAdminStackParamList, 'CreateHotel'>

type RoomTypeForm = { name: string; default_capacity: string; monthly_price: string }
type RoomForm = { room_number: string; room_type: string; capacity: string }

const CreateHotelScreen = ({ navigation }: Props) => {
  const [name, setName] = useState('')
  const [city, setCity] = useState('')
  const [ownerName, setOwnerName] = useState('')
  const [ownerEmail, setOwnerEmail] = useState('')
  const [ownerPassword, setOwnerPassword] = useState('')

  const [roomTypes, setRoomTypes] = useState<RoomTypeForm[]>([{ name: '', default_capacity: '4', monthly_price: '' }])
  const [rooms, setRooms] = useState<RoomForm[]>([{ room_number: '', room_type: '', capacity: '4' }])

  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const updateRoomType = (idx: number, patch: Partial<RoomTypeForm>) =>
    setRoomTypes(prev => prev.map((rt, i) => (i === idx ? { ...rt, ...patch } : rt)))

  const updateRoom = (idx: number, patch: Partial<RoomForm>) =>
    setRooms(prev => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)))

  const handleSubmit = async () => {
    setError(null)
    setSubmitting(true)

    try {
      await api.post('/hotels', {
        name,
        building_type: 'flat',
        city,
        floor_count: 1,
        owner: { name: ownerName, email: ownerEmail, password: ownerPassword },
        room_types: roomTypes.map(rt => ({
          name: rt.name,
          default_capacity: Number(rt.default_capacity),
          monthly_price: Number(rt.monthly_price)
        })),
        floors: [
          {
            number: 1,
            rooms: rooms.map(r => ({ room_number: r.room_number, room_type: r.room_type, capacity: Number(r.capacity) }))
          }
        ]
      })
      navigation.goBack()
    } catch (err) {
      if (err instanceof ApiError && err.errors) {
        setError(Object.values(err.errors).flat().join(' '))
      } else {
        setError(err instanceof ApiError ? err.message : 'Failed to create property.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Screen>
      <ErrorText>{error}</ErrorText>

      <Card>
        <H2>Property Details</H2>
        <Field label='Property Name' value={name} onChangeText={setName} />
        <Field label='City' value={city} onChangeText={setCity} />
      </Card>

      <Card>
        <H2>Owner</H2>
        <Muted>A new Owner account will be created with these credentials.</Muted>
        <Field label='Owner Name' value={ownerName} onChangeText={setOwnerName} />
        <Field label='Owner Email' value={ownerEmail} onChangeText={setOwnerEmail} keyboardType='email-address' />
        <Field label='Owner Password' value={ownerPassword} onChangeText={setOwnerPassword} secureTextEntry />
      </Card>

      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <H2>Room Types</H2>
          <Button
            title='+ Add'
            variant='outline'
            onPress={() => setRoomTypes(prev => [...prev, { name: '', default_capacity: '4', monthly_price: '' }])}
          />
        </View>
        {roomTypes.map((rt, idx) => (
          <Card key={idx} style={{ backgroundColor: '#F8F7FA' }}>
            <Field label='Name (e.g. Dorm-4)' value={rt.name} onChangeText={v => updateRoomType(idx, { name: v })} />
            <Field
              label='Default Capacity'
              value={rt.default_capacity}
              onChangeText={v => updateRoomType(idx, { default_capacity: v })}
              keyboardType='number-pad'
            />
            <Field
              label='Monthly Price'
              value={rt.monthly_price}
              onChangeText={v => updateRoomType(idx, { monthly_price: v })}
              keyboardType='decimal-pad'
            />
          </Card>
        ))}
      </Card>

      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <H2>Floor 1 - Rooms</H2>
          <Button
            title='+ Add'
            variant='outline'
            onPress={() => setRooms(prev => [...prev, { room_number: '', room_type: '', capacity: '4' }])}
          />
        </View>
        <Muted>Room Type must match a name entered above exactly.</Muted>
        {rooms.map((room, idx) => (
          <Card key={idx} style={{ backgroundColor: '#F8F7FA' }}>
            <Field label='Room #' value={room.room_number} onChangeText={v => updateRoom(idx, { room_number: v })} />
            <Field label='Room Type' value={room.room_type} onChangeText={v => updateRoom(idx, { room_type: v })} />
            <Field
              label='Capacity (beds)'
              value={room.capacity}
              onChangeText={v => updateRoom(idx, { capacity: v })}
              keyboardType='number-pad'
            />
          </Card>
        ))}
      </Card>

      <Button title={submitting ? 'Creating...' : 'Create Property'} onPress={handleSubmit} loading={submitting} />
    </Screen>
  )
}

export default CreateHotelScreen
