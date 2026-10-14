import React, { useState } from 'react'
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'

import { Button, ErrorText, Field, Screen, colors } from '../../components/ui'
import { fontFamily, spacing, type } from '../../theme/tokens'
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
      <View style={styles.header}>
        <Text style={styles.title}>Create your account</Text>
        <Text style={styles.subtitle}>Browse rooms, then register to submit a booking request</Text>
      </View>

      <ErrorText>{error}</ErrorText>

      <View style={{ gap: spacing.sm }}>
        <Field label='Full Name' icon='person-outline' value={form.name} onChangeText={v => setForm({ ...form, name: v })} />
        <Field
          label='Email'
          icon='mail-outline'
          value={form.email}
          onChangeText={v => setForm({ ...form, email: v })}
          keyboardType='email-address'
        />
        <Field
          label='Phone'
          icon='call-outline'
          value={form.phone}
          onChangeText={v => setForm({ ...form, phone: v })}
          keyboardType='phone-pad'
        />
        <Field
          label='Password'
          icon='lock-closed-outline'
          value={form.password}
          onChangeText={v => setForm({ ...form, password: v })}
          secureTextEntry
        />
        <Field
          label='Confirm Password'
          icon='lock-closed-outline'
          value={form.password_confirmation}
          onChangeText={v => setForm({ ...form, password_confirmation: v })}
          secureTextEntry
        />
      </View>

      <Button title='Register' onPress={handleRegister} loading={loading} icon='arrow-forward' />

      <Pressable onPress={() => navigation.navigate('Login')} style={styles.loginRow}>
        <Text style={styles.loginText}>
          Already have an account? <Text style={styles.loginLink}>Log In</Text>
        </Text>
      </Pressable>
    </Screen>
  )
}

export default RegisterScreen

const styles = StyleSheet.create({
  header: { gap: 4, marginTop: spacing.sm },
  title: { fontFamily: fontFamily.headingExtraBold, fontSize: 22, color: colors.textPrimary },
  subtitle: { ...type.body, color: colors.textMuted },
  loginRow: { alignItems: 'center', marginTop: spacing.xs },
  loginText: { ...type.body, color: colors.textSecondary },
  loginLink: { color: colors.accentDark, fontFamily: fontFamily.bodySemibold }
})
