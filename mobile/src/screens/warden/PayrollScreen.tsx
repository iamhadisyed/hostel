import React, { useCallback, useEffect, useState } from 'react'
import { View } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'

import { Badge, Button, Card, ErrorText, Field, H1, H2, Muted, Screen } from '../../components/ui'
import { api, ApiError } from '../../libs/api'
import { useMyHotels } from '../../hooks/useMyHotels'
import type { Payroll, Staff } from '../../types/api'

const PayrollScreen = () => {
  const { hotels, selectedHotelId, setSelectedHotelId } = useMyHotels()
  const [staffList, setStaffList] = useState<Staff[]>([])
  const [selectedStaffId, setSelectedStaffId] = useState<number | null>(null)
  const [payroll, setPayroll] = useState<Payroll[]>([])
  const [error, setError] = useState<string | null>(null)

  const [periodStart, setPeriodStart] = useState(new Date(new Date().setDate(1)).toISOString().slice(0, 10))
  const [periodEnd, setPeriodEnd] = useState(new Date().toISOString().slice(0, 10))
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    const load = async () => {
      if (!selectedHotelId) return

      try {
        const data = await api.get<Staff[]>(`/hotels/${selectedHotelId}/staff`)

        setStaffList(data)
        setSelectedStaffId(data[0]?.id ?? null)
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Failed to load staff.')
      }
    }

    load()
  }, [selectedHotelId])

  const loadPayroll = useCallback(async () => {
    if (!selectedStaffId) return

    try {
      const data = await api.get<Payroll[]>(`/staff/${selectedStaffId}/payroll`)

      setPayroll(data)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load payroll.')
    }
  }, [selectedStaffId])

  useFocusEffect(
    useCallback(() => {
      loadPayroll()
    }, [loadPayroll])
  )

  const generate = async () => {
    if (!selectedStaffId) return

    setGenerating(true)
    setError(null)

    try {
      await api.post(`/staff/${selectedStaffId}/payroll`, { period_start: periodStart, period_end: periodEnd })
      loadPayroll()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to generate payroll.')
    } finally {
      setGenerating(false)
    }
  }

  const pay = async (entry: Payroll) => {
    try {
      await api.patch(`/payroll/${entry.id}/pay`)
      loadPayroll()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to mark as paid.')
    }
  }

  return (
    <Screen>
      <H1>Payroll</H1>

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
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {staffList.map(s => (
          <Button
            key={s.id}
            title={s.name}
            variant={s.id === selectedStaffId ? 'primary' : 'outline'}
            onPress={() => setSelectedStaffId(s.id)}
            style={{ paddingHorizontal: 12 }}
          />
        ))}
      </View>

      <ErrorText>{error}</ErrorText>

      <Card>
        <H2>Generate Payroll</H2>
        <Field label='Period Start (YYYY-MM-DD)' value={periodStart} onChangeText={setPeriodStart} />
        <Field label='Period End (YYYY-MM-DD)' value={periodEnd} onChangeText={setPeriodEnd} />
        <Button title='Generate' onPress={generate} loading={generating} disabled={!selectedStaffId} />
      </Card>

      {payroll.map(entry => (
        <Card key={entry.id}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <H2>Rs. {entry.net_amount}</H2>
            <Badge label={entry.status} color={entry.status === 'paid' ? '#28C76F' : '#FF9F43'} />
          </View>
          <Muted>
            {entry.period_start} to {entry.period_end}
          </Muted>
          <Muted>
            Gross Rs. {entry.gross_amount} - Deductions Rs. {entry.total_deductions} - Advances Rs. {entry.total_advances}
          </Muted>
          {entry.status === 'pending' && <Button title='Mark Paid & Generate Slip' onPress={() => pay(entry)} />}
        </Card>
      ))}
      {payroll.length === 0 && <Muted>No payroll entries yet.</Muted>}
    </Screen>
  )
}

export default PayrollScreen
