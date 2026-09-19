import React, { useEffect, useState } from 'react'
import { Pressable, Text, View } from 'react-native'

import { Button, Card, ErrorText, Field, H1, InfoText, Muted, Screen } from '../../components/ui'
import { api, ApiError } from '../../libs/api'
import type { Booking } from '../../types/api'

const StarRating = ({ value, onChange }: { value: number; onChange: (v: number) => void }) => (
  <View style={{ flexDirection: 'row', gap: 8 }}>
    {[1, 2, 3, 4, 5].map(n => (
      <Pressable key={n} onPress={() => onChange(n)}>
        <Text style={{ fontSize: 32, color: n <= value ? '#FF9F43' : '#D0CEDB' }}>{n <= value ? '★' : '☆'}</Text>
      </Pressable>
    ))}
  </View>
)

const FeedbackScreen = () => {
  const [booking, setBooking] = useState<Booking | null>(null)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const bookings = await api.get<Booking[]>('/bookings')
        const eligible = bookings.find(b => b.status === 'active' || b.status === 'checked_out') ?? null

        setBooking(eligible)
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Failed to load your booking.')
      }
    }

    load()
  }, [])

  const submit = async () => {
    if (!booking || !rating) return

    setSubmitting(true)
    setError(null)

    try {
      await api.post(`/bookings/${booking.id}/feedback`, { rating, comment })
      setSuccess('Thank you for your feedback!')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to submit feedback.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!booking) {
    return (
      <Screen>
        <H1>Feedback</H1>
        <Muted>Feedback is available once you have an active or completed stay.</Muted>
      </Screen>
    )
  }

  return (
    <Screen>
      <H1>Feedback</H1>
      <ErrorText>{error}</ErrorText>
      <InfoText>{success}</InfoText>

      <Card>
        <Muted>Room {booking.room?.room_number ?? '-'}</Muted>
        <StarRating value={rating} onChange={setRating} />
        <Field label='Comments (optional)' value={comment} onChangeText={setComment} multiline numberOfLines={3} />
        <Button title='Submit Feedback' onPress={submit} loading={submitting} disabled={!rating} />
      </Card>
    </Screen>
  )
}

export default FeedbackScreen
