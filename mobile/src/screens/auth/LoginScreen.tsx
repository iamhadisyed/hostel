import React, { useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'

import { Button, ErrorText, Field, Logo, colors } from '../../components/ui'
import { brand, fontFamily, spacing, type } from '../../theme/tokens'
import { useAuth } from '../../contexts/AuthContext'
import { ApiError } from '../../libs/api'
import type { AuthStackParamList } from '../../navigation/types'

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>

const LoginScreen = ({ navigation }: Props) => {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
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
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.hero}>
        <Logo size={36} variant='light' />
        <Text style={styles.tagline}>{brand.tagline}</Text>
      </View>

      <View style={styles.sheet}>
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Sign in to manage your properties</Text>

        <ErrorText>{error}</ErrorText>

        <View style={{ gap: spacing.sm }}>
          <Field
            label='Email'
            icon='mail-outline'
            value={email}
            onChangeText={setEmail}
            keyboardType='email-address'
            autoComplete='email'
            placeholder='you@example.com'
          />
          <Field
            label='Password'
            icon='lock-closed-outline'
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            placeholder='••••••••'
          />
          <Pressable onPress={() => setShowPassword(v => !v)} hitSlop={8} style={styles.showPasswordRow}>
            <Text style={styles.showPasswordText}>{showPassword ? 'Hide password' : 'Show password'}</Text>
          </Pressable>
        </View>

        <Button title='Log In' onPress={handleLogin} loading={loading} icon='arrow-forward' />

        <Pressable onPress={() => navigation.navigate('Register')} style={styles.registerRow}>
          <Text style={styles.registerText}>
            New guest? <Text style={styles.registerLink}>Create an account</Text>
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  )
}

export default LoginScreen

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.primary },
  hero: { paddingHorizontal: spacing.lg, paddingTop: spacing.xxl, paddingBottom: spacing.xl, gap: spacing.sm },
  tagline: { ...type.bodyLg, color: 'rgba(255,255,255,0.82)' },
  sheet: {
    flex: 1,
    backgroundColor: colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: spacing.lg,
    gap: spacing.md
  },
  title: { fontFamily: fontFamily.headingExtraBold, fontSize: 24, color: colors.textPrimary },
  subtitle: { ...type.body, color: colors.textMuted, marginTop: -spacing.xs },
  showPasswordRow: { alignSelf: 'flex-end' },
  showPasswordText: { ...type.caption, color: colors.accentDark },
  registerRow: { alignItems: 'center', marginTop: spacing.xs },
  registerText: { ...type.body, color: colors.textSecondary },
  registerLink: { color: colors.accentDark, fontFamily: fontFamily.bodySemibold }
})
