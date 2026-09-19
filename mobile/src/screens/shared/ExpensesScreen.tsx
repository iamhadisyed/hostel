import React, { useCallback, useState } from 'react'
import { Modal, View } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'

import { Badge, Button, Card, ErrorText, Field, H1, H2, Muted, Screen } from '../../components/ui'
import { api, ApiError } from '../../libs/api'
import { useAuth } from '../../contexts/AuthContext'
import { useMyHotels } from '../../hooks/useMyHotels'
import type { Expense, ExpenseStatus } from '../../types/api'

const statusColor: Record<ExpenseStatus, string> = { pending: '#FF9F43', approved: '#28C76F', rejected: '#EA5455' }

const ExpensesScreen = () => {
  const { user } = useAuth()
  const { hotels, selectedHotelId, setSelectedHotelId } = useMyHotels()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const [category, setCategory] = useState('utility')
  const [vendor, setVendor] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [submitting, setSubmitting] = useState(false)

  const canReview = user?.role === 'owner' || user?.role === 'super_admin'

  const load = useCallback(async () => {
    if (!selectedHotelId) return

    setError(null)

    try {
      const data = await api.get<Expense[]>(`/hotels/${selectedHotelId}/expenses`)

      setExpenses(data)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load expenses.')
    }
  }, [selectedHotelId])

  useFocusEffect(
    useCallback(() => {
      load()
    }, [load])
  )

  const review = async (expense: Expense, decision: 'approved' | 'rejected') => {
    try {
      await api.patch(`/hotels/${selectedHotelId}/expenses/${expense.id}/review`, { decision })
      load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to review expense.')
    }
  }

  const logExpense = async () => {
    if (!selectedHotelId) return

    setSubmitting(true)
    setError(null)

    try {
      await api.post(`/hotels/${selectedHotelId}/expenses`, { category, vendor, amount: Number(amount), date })
      setModalOpen(false)
      setVendor('')
      setAmount('')
      load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to log expense.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Screen>
      <H1>Expenses</H1>

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

      <Button title='+ Log Expense' onPress={() => setModalOpen(true)} disabled={!selectedHotelId} />

      <ErrorText>{error}</ErrorText>

      {expenses.map(expense => (
        <Card key={expense.id}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <H2>Rs. {expense.amount}</H2>
            <Badge label={expense.status} color={statusColor[expense.status]} />
          </View>
          <Muted>
            {expense.category.replace('_', ' ')} - {expense.vendor ?? 'No vendor'} - {expense.date}
          </Muted>
          {canReview && expense.status === 'pending' && (
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
              <Button title='Approve' variant='success' onPress={() => review(expense, 'approved')} style={{ flex: 1 }} />
              <Button title='Reject' variant='danger' onPress={() => review(expense, 'rejected')} style={{ flex: 1 }} />
            </View>
          )}
        </Card>
      ))}
      {expenses.length === 0 && <Muted>No expenses found.</Muted>}

      <Modal visible={modalOpen} animationType='slide' onRequestClose={() => setModalOpen(false)}>
        <Screen>
          <H1>Log Expense</H1>
          <ErrorText>{error}</ErrorText>
          <Field label='Category (vendor_payment/utility/maintenance/other)' value={category} onChangeText={setCategory} />
          <Field label='Vendor' value={vendor} onChangeText={setVendor} />
          <Field label='Amount' value={amount} onChangeText={setAmount} keyboardType='decimal-pad' />
          <Field label='Date (YYYY-MM-DD)' value={date} onChangeText={setDate} />
          <Button title='Save' onPress={logExpense} loading={submitting} />
          <Button title='Cancel' variant='outline' onPress={() => setModalOpen(false)} />
        </Screen>
      </Modal>
    </Screen>
  )
}

export default ExpensesScreen
