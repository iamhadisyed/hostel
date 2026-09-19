import React, { useCallback, useState } from 'react'
import { Modal, View } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'

import { Badge, Button, Card, ErrorText, Field, H1, H2, Muted, Screen } from '../../components/ui'
import { api, ApiError } from '../../libs/api'
import { useMyHotels } from '../../hooks/useMyHotels'
import type { User } from '../../types/api'

const AccountsScreen = () => {
  const { hotels, selectedHotelId, setSelectedHotelId } = useMyHotels()
  const [accounts, setAccounts] = useState<User[]>([])
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'warden' })
  const [submitting, setSubmitting] = useState(false)

  const load = useCallback(async () => {
    if (!selectedHotelId) return

    setError(null)

    try {
      const data = await api.get<User[]>(`/hotels/${selectedHotelId}/accounts`)

      setAccounts(data)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load accounts.')
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
      await api.post(`/hotels/${selectedHotelId}/accounts`, form)
      setModalOpen(false)
      setForm({ name: '', email: '', password: '', role: 'warden' })
      load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create account.')
    } finally {
      setSubmitting(false)
    }
  }

  const deactivate = async (account: User) => {
    if (!selectedHotelId) return

    try {
      await api.delete(`/hotels/${selectedHotelId}/accounts/${account.id}`)
      load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to deactivate account.')
    }
  }

  return (
    <Screen>
      <H1>Warden & Front Desk Accounts</H1>

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

      <Button title='+ New Account' onPress={() => setModalOpen(true)} disabled={!selectedHotelId} />

      <ErrorText>{error}</ErrorText>

      {accounts.map(account => (
        <Card key={account.id}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <H2>{account.name}</H2>
            <Badge label={account.is_active ? 'Active' : 'Deactivated'} color={account.is_active ? '#28C76F' : '#6E6B7B'} />
          </View>
          <Muted>
            {account.email} - {account.role.replace('_', ' ')}
          </Muted>
          {account.is_active && <Button title='Deactivate' variant='danger' onPress={() => deactivate(account)} />}
        </Card>
      ))}
      {accounts.length === 0 && <Muted>No accounts yet.</Muted>}

      <Modal visible={modalOpen} animationType='slide' onRequestClose={() => setModalOpen(false)}>
        <Screen>
          <H1>New Account</H1>
          <ErrorText>{error}</ErrorText>
          <Field label='Role (warden / front_desk)' value={form.role} onChangeText={v => setForm({ ...form, role: v })} />
          <Field label='Name' value={form.name} onChangeText={v => setForm({ ...form, name: v })} />
          <Field label='Email' value={form.email} onChangeText={v => setForm({ ...form, email: v })} keyboardType='email-address' />
          <Field label='Password' value={form.password} onChangeText={v => setForm({ ...form, password: v })} secureTextEntry />
          <Button title='Create' onPress={handleCreate} loading={submitting} />
          <Button title='Cancel' variant='outline' onPress={() => setModalOpen(false)} />
        </Screen>
      </Modal>
    </Screen>
  )
}

export default AccountsScreen
