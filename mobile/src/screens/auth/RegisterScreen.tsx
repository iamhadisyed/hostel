import React, { useState } from 'react'
import { Alert, Pressable, Text, View } from 'react-native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'

import { Button, ErrorText, Field, H1, Muted, Screen } from '../../components/ui'
import { useAuth } from '../../contexts/AuthContext'
import { ApiError } from '../../libs/api'
import type { AuthStackParamList } from '../../navigation/types'

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>

const RegisterScreen = ({ navigation }: Props) => {
  const { register } = useAuth()
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', password_confirmation: '' })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleRegister = async () => {
    setError(null)
    setLoading(true)

    try {
      await register(form)
      // Registering logs the guest in immediately; the app then switches to
      // the Student tabs, where a banner prompts email verification without
      // blocking browsing (per spec, unverified guests still have read access).
      Alert.alert('Check your email', 'We sent you a verification code. You can verify it any time from the app.')
    } catch (err) {
      if (err instanceof ApiError && err.errors) {
        setError(Object.values(err.errors).flat().join(' '))
      } else {
        setError(err instanceof ApiError ? err.message : 'Something went wrong.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Screen>
      <View style={{ gap: 4, marginTop: 24 }}>
        <H1>Create your account</H1>
        <Muted>Browse rooms, then register to submit a booking request</Muted>
      </View>

      <ErrorText>{error}</ErrorText>

      <Field label='Full Name' value={form.name} onChangeText={v => setForm({ ...form, name: v })} />
      <Field label='Email' value={form.email} onChangeText={v => setForm({ ...form, email: v })} keyboardType='email-address' />
      <Field label='Phone' value={form.phone} onChangeText={v => setForm({ ...form, phone: v })} keyboardType='phone-pad' />
      <Field label='Password' value={form.password} onChangeText={v => setForm({ ...form, password: v })} secureTextEntry />
      <Field
        label='Confirm Password'
        value={form.password_confirmation}
        onChangeText={v => setForm({ ...form, password_confirmation: v })}
        secureTextEntry
      />

      <Button title='Register' onPress={handleRegister} loading={loading} />

      <Pressable onPress={() => navigation.navigate('Login')} style={{ alignItems: 'center', marginTop: 8 }}>
        <Text>
          Already have an account? <Text style={{ color: '#7367F0', fontWeight: '600' }}>Log In</Text>
        </Text>
      </Pressable>
    </Screen>
  )
}

export default RegisterScreen
