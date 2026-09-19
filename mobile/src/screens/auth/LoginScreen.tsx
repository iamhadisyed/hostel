import React, { useState } from 'react'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'

import { Button, ErrorText, Field, H1, Muted, Screen } from '../../components/ui'
import { useAuth } from '../../contexts/AuthContext'
import { ApiError } from '../../libs/api'
import type { AuthStackParamList } from '../../navigation/types'
import { View, Text, Pressable } from 'react-native'

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>

const LoginScreen = ({ navigation }: Props) => {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    setError(null)
    setLoading(true)

    try {
      await login(email, password)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Screen>
      <View style={{ gap: 4, marginTop: 40 }}>
        <H1>Welcome back</H1>
        <Muted>Sign in to manage your hostel/hotel</Muted>
      </View>

      <ErrorText>{error}</ErrorText>

      <Field label='Email' value={email} onChangeText={setEmail} keyboardType='email-address' autoComplete='email' />
      <Field label='Password' value={password} onChangeText={setPassword} secureTextEntry />

      <Button title='Log In' onPress={handleLogin} loading={loading} />

      <Pressable onPress={() => navigation.navigate('Register')} style={{ alignItems: 'center', marginTop: 8 }}>
        <Text>
          New guest? <Text style={{ color: '#7367F0', fontWeight: '600' }}>Register</Text>
        </Text>
      </Pressable>
    </Screen>
  )
}

export default LoginScreen
