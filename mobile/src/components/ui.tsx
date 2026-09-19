import React from 'react'
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle
} from 'react-native'

export const colors = {
  primary: '#7367F0',
  success: '#28C76F',
  warning: '#FF9F43',
  error: '#EA5455',
  info: '#00CFE8',
  text: '#2E2B3B',
  muted: '#6E6B7B',
  border: '#E0E0E0',
  background: '#F8F7FA',
  surface: '#FFFFFF'
}

export const Screen = ({ children, style }: { children: React.ReactNode; style?: ViewStyle }) => (
  <ScrollView
    style={[styles.screen, style]}
    contentContainerStyle={styles.screenContent}
    keyboardShouldPersistTaps='handled'
  >
    {children}
  </ScrollView>
)

export const Card = ({ children, style }: { children: React.ReactNode; style?: ViewStyle }) => (
  <View style={[styles.card, style]}>{children}</View>
)

export const H1 = ({ children }: { children: React.ReactNode }) => <Text style={styles.h1}>{children}</Text>
export const H2 = ({ children }: { children: React.ReactNode }) => <Text style={styles.h2}>{children}</Text>
export const Muted = ({ children }: { children: React.ReactNode }) => <Text style={styles.muted}>{children}</Text>

export const Field = (props: TextInputProps & { label: string }) => (
  <View style={styles.field}>
    <Text style={styles.label}>{props.label}</Text>
    <TextInput
      {...props}
      style={[styles.input, props.style]}
      placeholderTextColor='#B0AEBB'
      autoCapitalize={props.autoCapitalize ?? 'none'}
    />
  </View>
)

export const Button = ({
  title,
  onPress,
  loading,
  disabled,
  variant = 'primary',
  style
}: {
  title: string
  onPress: () => void
  loading?: boolean
  disabled?: boolean
  variant?: 'primary' | 'outline' | 'danger' | 'success'
  style?: ViewStyle
}) => {
  const bg =
    variant === 'primary'
      ? colors.primary
      : variant === 'danger'
        ? colors.error
        : variant === 'success'
          ? colors.success
          : 'transparent'

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        { backgroundColor: bg, borderColor: variant === 'outline' ? colors.primary : bg, opacity: disabled ? 0.6 : 1 },
        style
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? colors.primary : '#fff'} />
      ) : (
        <Text style={[styles.buttonText, { color: variant === 'outline' ? colors.primary : '#fff' }]}>{title}</Text>
      )}
    </Pressable>
  )
}

export const Badge = ({ label, color = colors.muted }: { label: string; color?: string }) => (
  <View style={[styles.badge, { backgroundColor: `${color}22` }]}>
    <Text style={[styles.badgeText, { color }]}>{label}</Text>
  </View>
)

export const ErrorText = ({ children }: { children: string | null }) => {
  if (!children) return null

  return (
    <View style={styles.errorBox}>
      <Text style={styles.errorText}>{children}</Text>
    </View>
  )
}

export const InfoText = ({ children }: { children: string | null }) => {
  if (!children) return null

  return (
    <View style={styles.infoBox}>
      <Text style={styles.infoTextContent}>{children}</Text>
    </View>
  )
}

export const Row = ({ children, style }: { children: React.ReactNode; style?: ViewStyle }) => (
  <View style={[styles.row, style]}>{children}</View>
)

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  screenContent: { padding: 16, gap: 16 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2
  },
  h1: { fontSize: 24, fontWeight: '700', color: colors.text },
  h2: { fontSize: 18, fontWeight: '600', color: colors.text },
  muted: { fontSize: 13, color: colors.muted },
  field: { gap: 4 },
  label: { fontSize: 13, color: colors.muted },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.surface
  },
  button: {
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1
  },
  buttonText: { fontSize: 15, fontWeight: '600' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, alignSelf: 'flex-start' },
  badgeText: { fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
  errorBox: { backgroundColor: '#EA545522', padding: 10, borderRadius: 8 },
  errorText: { color: colors.error, fontSize: 13 },
  infoBox: { backgroundColor: '#00CFE822', padding: 10, borderRadius: 8 },
  infoTextContent: { color: '#0090A3', fontSize: 13 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 }
})
