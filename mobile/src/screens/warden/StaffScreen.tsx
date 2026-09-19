import React, { useCallback, useState } from 'react'
import { Modal, View } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'

import { Badge, Button, Card, ErrorText, Field, H1, H2, Muted, Screen } from '../../components/ui'
import { api, ApiError } from '../../libs/api'
import { useMyHotels } from '../../hooks/useMyHotels'
import type { Staff } from '../../types/api'

const StaffScreen = () => {
  const { hotels, selectedHotelId, setSelectedHotelId } = useMyHotels()
  const [staff, setStaff] = useState<Staff[]>([])
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [attendanceStaff, setAttendanceStaff] = useState<Staff | null>(null)

  const [form, setForm] = useState({ name: '', designation: '', wage_type: 'daily', rate: '' })
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().slice(0, 10))
  const [attendanceStatus, setAttendanceStatus] = useState('present')
  const [submitting, setSubmitting] = useState(false)

  const load = useCallback(async () => {
    if (!selectedHotelId) return

    setError(null)

    try {
      const data = await api.get<Staff[]>(`/hotels/${selectedHotelId}/staff`)

      setStaff(data)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load staff.')
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
      await api.post(`/hotels/${selectedHotelId}/staff`, { ...form, rate: Number(form.rate) })
      setModalOpen(false)
      setForm({ name: '', designation: '', wage_type: 'daily', rate: '' })
      load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to add staff.')
    } finally {
      setSubmitting(false)
    }
  }

  const markAttendance = async () => {
    if (!attendanceStaff) return

    try {
      await api.post(`/staff/${attendanceStaff.id}/attendance`, { date: attendanceDate, status: attendanceStatus })
      setAttendanceStaff(null)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to mark attendance.')
    }
  }

  return (
    <Screen>
      <H1>Staff</H1>

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

      <Button title='+ Add Staff' onPress={() => setModalOpen(true)} disabled={!selectedHotelId} />

      <ErrorText>{error}</ErrorText>

      {staff.map(member => (
        <Card key={member.id}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <H2>{member.name}</H2>
            <Badge label={member.is_active ? 'Active' : 'Inactive'} color={member.is_active ? '#28C76F' : '#6E6B7B'} />
          </View>
          <Muted>
            {member.designation} - {member.wage_type} - Rs. {member.rate}
          </Muted>
          {member.wage_type === 'daily' && <Button title='Mark Attendance' variant='outline' onPress={() => setAttendanceStaff(member)} />}
        </Card>
      ))}
      {staff.length === 0 && <Muted>No staff yet.</Muted>}

      <Modal visible={modalOpen} animationType='slide' onRequestClose={() => setModalOpen(false)}>
        <Screen>
          <H1>Add Staff</H1>
          <Field label='Name' value={form.name} onChangeText={v => setForm({ ...form, name: v })} />
          <Field label='Designation' value={form.designation} onChangeText={v => setForm({ ...form, designation: v })} />
          <Field label='Wage Type (daily/monthly)' value={form.wage_type} onChangeText={v => setForm({ ...form, wage_type: v })} />
          <Field label='Rate' value={form.rate} onChangeText={v => setForm({ ...form, rate: v })} keyboardType='decimal-pad' />
          <Button title='Save' onPress={handleCreate} loading={submitting} />
          <Button title='Cancel' variant='outline' onPress={() => setModalOpen(false)} />
        </Screen>
      </Modal>

      <Modal visible={!!attendanceStaff} animationType='slide' onRequestClose={() => setAttendanceStaff(null)}>
        <Screen>
          <H1>Mark Attendance</H1>
          <Muted>{attendanceStaff?.name}</Muted>
          <Field label='Date (YYYY-MM-DD)' value={attendanceDate} onChangeText={setAttendanceDate} />
          <Field label='Status (present/absent/half_day/leave)' value={attendanceStatus} onChangeText={setAttendanceStatus} />
          <Button title='Save' onPress={markAttendance} />
          <Button title='Cancel' variant='outline' onPress={() => setAttendanceStaff(null)} />
        </Screen>
      </Modal>
    </Screen>
  )
}

export default StaffScreen
