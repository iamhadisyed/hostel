import React, { useState } from 'react'
import { Modal } from 'react-native'

import { Button, Card, ErrorText, H1, InfoText, Muted, Screen, Field } from './ui'
import { useAuth } from '../contexts/AuthContext'
import { api, ApiError } from '../libs/api'

/**
 * Shown on Student screens for guests who haven't verified their email yet.
 * Per spec this never blocks browsing - it's a reminder, not a gate - since
 * a voucher simply won't be generated for their booking until they verify.
 */
const VerifyEmailBanner = () => {
  const { user, refreshUser } = useAuth()
  const [modalOpen, setModalOpen] = useState(false)
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)

  if (!user || user.email_verified_at) return null

  const verify = async () => {
    setError(null)
    setLoading(true)

    try {
      await api.post('/otp/verify', { code })
      await refreshUser()
      setModalOpen(false)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Verification failed.')
    } finally {
      setLoading(false)
    }
  }

  const resend = async () => {
    setError(null)
    setInfo(null)
    setResending(true)

    try {
      const res = await api.post<{ message: string }>('/otp/send')

      setInfo(res.message)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not resend code.')
    } finally {
      setResending(false)
    }
  }

  return (
    <>
      <Card style={{ backgroundColor: '#FF9F4322' }}>
        <Muted>Your email isn&apos;t verified yet. A voucher won&apos;t be generated for your booking until you verify.</Muted>
        <Button title='Verify Email' variant='outline' onPress={() => setModalOpen(true)} />
      </Card>

      <Modal visible={modalOpen} animationType='slide' onRequestClose={() => setModalOpen(false)}>
        <Screen>
          <H1>Verify your email</H1>
          <Muted>Enter the 6-digit code we emailed you{user.email ? ` to ${user.email}` : ''}.</Muted>
          <ErrorText>{error}</ErrorText>
          <InfoText>{info}</InfoText>
          <Field label='Verification Code' value={code} onChangeText={setCode} keyboardType='number-pad' />
          <Button title='Verify' onPress={verify} loading={loading} />
          <Button title='Resend Code' variant='outline' onPress={resend} loading={resending} />
          <Button title='Close' variant='outline' onPress={() => setModalOpen(false)} />
        </Screen>
      </Modal>
    </>
  )
}

export default VerifyEmailBanner
