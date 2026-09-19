import React, { useCallback, useState } from 'react'
import { Modal, View } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'

import { Badge, Button, Card, ErrorText, Field, H1, H2, Muted, Screen } from '../../components/ui'
import { api, ApiError } from '../../libs/api'
import { useMyHotels } from '../../hooks/useMyHotels'
import type { VisitorPass } from '../../types/api'

const VisitorsScreen = () => {
  const { hotels, selectedHotelId, setSelectedHotelId } = useMyHotels()
  const [passes, setPasses] = useState<VisitorPass[]>([])
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ visitor_name: '', cnic: '', phone: '', purpose: '' })
  const [submitting, setSubmitting] = useState(false)

  const load = useCallback(async () => {
    if (!selectedHotelId) return

    setError(null)

    try {
      const data = await api.get<VisitorPass[]>(`/hotels/${selectedHotelId}/visitor-passes`)

      setPasses(data)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load visitor passes.')
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
      await api.post(`/hotels/${selectedHotelId}/visitor-passes`, form)
      setModalOpen(false)
      setForm({ visitor_name: '', cnic: '', phone: '', purpose: '' })
      load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to log visitor.')
    } finally {
      setSubmitting(false)
    }
  }

  const checkout = async (pass: VisitorPass) => {
    if (!selectedHotelId) return

    try {
      await api.patch(`/hotels/${selectedHotelId}/visitor-passes/${pass.id}/checkout`)
      load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to check out visitor.')
    }
  }

  return (
    <Screen>
      <H1>Visitor Passes</H1>

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

      <Button title='+ Log Visitor' onPress={() => setModalOpen(true)} disabled={!selectedHotelId} />

      <ErrorText>{error}</ErrorText>

      {passes.map(pass => (
        <Card key={pass.id}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <H2>{pass.visitor_name}</H2>
            <Badge label={pass.checked_out_at ? 'Checked Out' : 'On Premises'} color={pass.checked_out_at ? '#6E6B7B' : '#28C76F'} />
          </View>
          <Muted>{pass.purpose ?? 'No purpose noted'}</Muted>
          <Muted>{new Date(pass.checked_in_at).toLocaleString()}</Muted>
          {!pass.checked_out_at && <Button title='Check Out' variant='outline' onPress={() => checkout(pass)} />}
        </Card>
      ))}
      {passes.length === 0 && <Muted>No visitors logged yet.</Muted>}

      <Modal visible={modalOpen} animationType='slide' onRequestClose={() => setModalOpen(false)}>
        <Screen>
          <H1>Log Visitor</H1>
          <Field label='Visitor Name' value={form.visitor_name} onChangeText={v => setForm({ ...form, visitor_name: v })} />
          <Field label='CNIC' value={form.cnic} onChangeText={v => setForm({ ...form, cnic: v })} />
          <Field label='Phone' value={form.phone} onChangeText={v => setForm({ ...form, phone: v })} />
          <Field label='Purpose' value={form.purpose} onChangeText={v => setForm({ ...form, purpose: v })} />
          <Button title='Save' onPress={handleCreate} loading={submitting} />
          <Button title='Cancel' variant='outline' onPress={() => setModalOpen(false)} />
        </Screen>
      </Modal>
    </Screen>
  )
}

export default VisitorsScreen
