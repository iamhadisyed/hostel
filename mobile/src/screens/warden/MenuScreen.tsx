import React, { useCallback, useState } from 'react'
import { Modal, Switch, View } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'

import { Button, Card, ErrorText, Field, H1, Muted, Screen } from '../../components/ui'
import { api, ApiError } from '../../libs/api'
import { useMyHotels } from '../../hooks/useMyHotels'
import type { MenuItem } from '../../types/api'

const MenuScreen = () => {
  const { hotels, selectedHotelId, setSelectedHotelId } = useMyHotels()
  const [items, setItems] = useState<MenuItem[]>([])
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', price: '' })
  const [submitting, setSubmitting] = useState(false)

  const load = useCallback(async () => {
    if (!selectedHotelId) return

    setError(null)

    try {
      const data = await api.get<MenuItem[]>(`/hotels/${selectedHotelId}/menu`)

      setItems(data)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load menu.')
    }
  }, [selectedHotelId])

  useFocusEffect(
    useCallback(() => {
      load()
    }, [load])
  )

  const handleCreate = async () => {
    if (!selectedHotelId) return

    setSubmitting(true)
    setError(null)

    try {
      await api.post(`/hotels/${selectedHotelId}/menu`, { ...form, price: Number(form.price) })
      setModalOpen(false)
      setForm({ name: '', description: '', price: '' })
      load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to add item.')
    } finally {
      setSubmitting(false)
    }
  }

  const toggleAvailability = async (item: MenuItem) => {
    if (!selectedHotelId) return

    try {
      await api.patch(`/hotels/${selectedHotelId}/menu/${item.id}`, { is_available: !item.is_available })
      load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update item.')
    }
  }

  return (
    <Screen>
      <H1>Food Menu</H1>

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

      <Button title='+ Add Item' onPress={() => setModalOpen(true)} disabled={!selectedHotelId} />

      <ErrorText>{error}</ErrorText>

      {items.map(item => (
        <Card key={item.id}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Muted>{item.name}</Muted>
              <Muted>Rs. {item.price}</Muted>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Muted>{item.is_available ? 'Available' : 'Unavailable'}</Muted>
              <Switch value={item.is_available} onValueChange={() => toggleAvailability(item)} />
            </View>
          </View>
        </Card>
      ))}
      {items.length === 0 && <Muted>No menu items yet.</Muted>}

      <Modal visible={modalOpen} animationType='slide' onRequestClose={() => setModalOpen(false)}>
        <Screen>
          <H1>Add Menu Item</H1>
          <Field label='Name' value={form.name} onChangeText={v => setForm({ ...form, name: v })} />
          <Field label='Description' value={form.description} onChangeText={v => setForm({ ...form, description: v })} />
          <Field label='Price' value={form.price} onChangeText={v => setForm({ ...form, price: v })} keyboardType='decimal-pad' />
          <Button title='Save' onPress={handleCreate} loading={submitting} />
          <Button title='Cancel' variant='outline' onPress={() => setModalOpen(false)} />
        </Screen>
      </Modal>
    </Screen>
  )
}

export default MenuScreen
