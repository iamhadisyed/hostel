import React from 'react'
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'

import { colors as tokenColors, elevation, fontFamily, palette, radius, spacing, touchTarget, type } from '../theme/tokens'

// ---------------------------------------------------------------------------
// Legacy color API (kept so every existing screen that imports `colors` by
// its old key names keeps working unchanged) + the full new token palette.
// ---------------------------------------------------------------------------
export const colors = {
  ...tokenColors,
  white: palette.white,
  // legacy aliases
  primary: tokenColors.primary,
  success: tokenColors.success,
  warning: tokenColors.warning,
  error: tokenColors.danger,
  info: tokenColors.info,
  text: tokenColors.textPrimary,
  muted: tokenColors.textMuted,
  border: tokenColors.border,
  background: tokenColors.background,
  surface: tokenColors.surface
}

// ---------------------------------------------------------------------------
// Brand mark
// ---------------------------------------------------------------------------
const logoMark = require('../../assets/logo-mark.png')

export const Logo = ({
  size = 32,
  withWordmark = true,
  variant = 'dark'
}: {
  size?: number
  withWordmark?: boolean
  variant?: 'dark' | 'light'
}) => (
  <View style={styles.logoRow}>
    <Image source={logoMark} style={{ width: size, height: size }} resizeMode='contain' />
    {withWordmark && (
      <Text style={[styles.logoText, { color: variant === 'light' ? colors.white : colors.textPrimary, fontSize: size * 0.56 }]}>
        Stay<Text style={{ color: colors.accent }}>Pilot</Text>
      </Text>
    )}
  </View>
)

// ---------------------------------------------------------------------------
// Layout primitives
// ---------------------------------------------------------------------------
export const Screen = ({
  children,
  style,
  scroll = true,
  padded = true
}: {
  children: React.ReactNode
  style?: ViewStyle
  scroll?: boolean
  padded?: boolean
}) => {
  return (
    <View style={styles.screen}>
      {scroll ? (
        <ScrollView contentContainerStyle={[padded && styles.screenContent, style]} keyboardShouldPersistTaps='handled'>
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.screenFlex, padded && styles.screenContent, style]}>{children}</View>
      )}
    </View>
  )
}

export const Row = ({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) => (
  <View style={[styles.row, style]}>{children}</View>
)

export const Divider = ({ style }: { style?: ViewStyle }) => <View style={[styles.divider, style]} />

export const Card = ({
  children,
  style,
  elevated = true
}: {
  children: React.ReactNode
  style?: StyleProp<ViewStyle>
  elevated?: boolean
}) => <View style={[styles.card, elevated && elevation.sm, style]}>{children}</View>

// ---------------------------------------------------------------------------
// Typography
// ---------------------------------------------------------------------------
const Text_ = (textType: keyof typeof type) => {
  const Comp = ({ children, style, color }: { children: React.ReactNode; style?: StyleProp<TextStyle>; color?: string }) => (
    <Text style={[type[textType], { color: color ?? colors.textPrimary }, style]}>{children}</Text>
  )

  return Comp
}

export const Display = Text_('display')
export const H1 = Text_('h1')
export const H2 = Text_('h2')
export const H3 = Text_('h3')
export const BodyText = Text_('bodyLg')
export const Caption = Text_('caption')
export const Muted = ({ children, style }: { children: React.ReactNode; style?: StyleProp<TextStyle> }) => (
  <Text style={[type.body, { color: colors.textMuted }, style]}>{children}</Text>
)

// ---------------------------------------------------------------------------
// Form controls
// ---------------------------------------------------------------------------
export const Field = (
  props: TextInputProps & { label: string; icon?: keyof typeof Ionicons.glyphMap; error?: string | null }
) => {
  const { label, icon, error, style, ...rest } = props

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputWrap, error && styles.inputWrapError]}>
        {icon && <Ionicons name={icon} size={18} color={colors.textMuted} style={styles.inputIcon} />}
        <TextInput
          {...rest}
          style={[styles.input, icon ? { paddingLeft: 4 } : null, style]}
          placeholderTextColor={colors.textMuted}
          autoCapitalize={rest.autoCapitalize ?? 'none'}
        />
      </View>
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  )
}

export const Button = ({
  title,
  onPress,
  loading,
  disabled,
  variant = 'primary',
  icon,
  style,
  fullWidth = true
}: {
  title: string
  onPress: () => void
  loading?: boolean
  disabled?: boolean
  variant?: 'primary' | 'accent' | 'outline' | 'ghost' | 'danger' | 'success'
  icon?: keyof typeof Ionicons.glyphMap
  style?: StyleProp<ViewStyle>
  fullWidth?: boolean
}) => {
  const bg =
    variant === 'primary'
      ? colors.primary
      : variant === 'accent'
        ? colors.accent
        : variant === 'danger'
          ? colors.danger
          : variant === 'success'
            ? colors.success
            : 'transparent'

  const isFilled = variant === 'primary' || variant === 'accent' || variant === 'danger' || variant === 'success'
  const fgColor = isFilled ? colors.white : variant === 'outline' ? colors.primary : colors.textSecondary

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole='button'
      accessibilityState={{ disabled: disabled || loading }}
      style={({ pressed }) => [
        styles.button,
        !fullWidth && { alignSelf: 'flex-start', paddingHorizontal: spacing.lg },
        {
          backgroundColor: bg,
          borderColor: variant === 'outline' ? colors.primary : variant === 'ghost' ? 'transparent' : bg,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1
        },
        style
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fgColor} />
      ) : (
        <View style={styles.buttonInner}>
          {icon && <Ionicons name={icon} size={18} color={fgColor} />}
          <Text style={[styles.buttonText, { color: fgColor }]}>{title}</Text>
        </View>
      )}
    </Pressable>
  )
}

export const IconButton = ({
  icon,
  onPress,
  color = colors.textSecondary,
  background = colors.surfaceAlt,
  size = touchTarget.min,
  accessibilityLabel
}: {
  icon: keyof typeof Ionicons.glyphMap
  onPress: () => void
  color?: string
  background?: string
  size?: number
  accessibilityLabel: string
}) => (
  <Pressable
    onPress={onPress}
    accessibilityRole='button'
    accessibilityLabel={accessibilityLabel}
    hitSlop={8}
    style={({ pressed }) => [
      styles.iconButton,
      { width: size, height: size, borderRadius: size / 2, backgroundColor: background, opacity: pressed ? 0.7 : 1 }
    ]}
  >
    <Ionicons name={icon} size={Math.round(size * 0.46)} color={color} />
  </Pressable>
)

// ---------------------------------------------------------------------------
// Status / badges
// ---------------------------------------------------------------------------
export const Badge = ({ label, color = colors.textMuted }: { label: string; color?: string }) => (
  <View style={[styles.badge, { backgroundColor: `${color}1F` }]}>
    <Text style={[styles.badgeText, { color }]}>{label}</Text>
  </View>
)

const STATUS_COLOR_MAP: Record<string, string> = {
  pending: colors.statusPending,
  pending_payment: colors.statusPending,
  active: colors.statusActive,
  approved: colors.statusApproved,
  paid: colors.statusApproved,
  present: colors.statusApproved,
  delivered: colors.statusApproved,
  rejected: colors.statusRejected,
  cancelled: colors.statusRejected,
  expired: colors.statusRejected,
  absent: colors.statusRejected,
  checked_out: colors.statusNeutral,
  unpaid: colors.statusPending,
  preparing: colors.statusActive,
  half_day: colors.statusPending,
  leave: colors.statusNeutral
}

export const StatusBadge = ({ status }: { status: string }) => (
  <Badge label={status.replace(/_/g, ' ')} color={STATUS_COLOR_MAP[status] ?? colors.textMuted} />
)

export const Chip = ({
  label,
  selected,
  onPress
}: {
  label: string
  selected?: boolean
  onPress?: () => void
}) => (
  <Pressable
    onPress={onPress}
    style={[styles.chip, selected && { backgroundColor: colors.primary, borderColor: colors.primary }]}
  >
    <Text style={[styles.chipText, selected && { color: colors.white }]}>{label}</Text>
  </Pressable>
)

// ---------------------------------------------------------------------------
// Feedback text (legacy API kept) + new state blocks
// ---------------------------------------------------------------------------
export const ErrorText = ({ children }: { children: string | null }) => {
  if (!children) return null

  return (
    <View style={styles.errorBox}>
      <Ionicons name='alert-circle' size={16} color={colors.danger} />
      <Text style={styles.errorText}>{children}</Text>
    </View>
  )
}

export const InfoText = ({ children }: { children: string | null }) => {
  if (!children) return null

  return (
    <View style={styles.infoBox}>
      <Ionicons name='information-circle' size={16} color={colors.accentDark} />
      <Text style={styles.infoTextContent}>{children}</Text>
    </View>
  )
}

export const EmptyState = ({
  icon = 'file-tray-outline',
  title,
  message
}: {
  icon?: keyof typeof Ionicons.glyphMap
  title: string
  message?: string
}) => (
  <View style={styles.stateBlock}>
    <View style={styles.stateIconWrap}>
      <Ionicons name={icon} size={28} color={colors.textMuted} />
    </View>
    <Text style={styles.stateTitle}>{title}</Text>
    {message && <Text style={styles.stateMessage}>{message}</Text>}
  </View>
)

export const ErrorState = ({
  message,
  onRetry
}: {
  message: string
  onRetry?: () => void
}) => (
  <View style={styles.stateBlock}>
    <View style={[styles.stateIconWrap, { backgroundColor: colors.dangerSurface }]}>
      <Ionicons name='cloud-offline-outline' size={28} color={colors.danger} />
    </View>
    <Text style={styles.stateTitle}>Something went wrong</Text>
    <Text style={styles.stateMessage}>{message}</Text>
    {onRetry && <Button title='Try again' variant='outline' onPress={onRetry} fullWidth={false} style={{ marginTop: spacing.sm }} />}
  </View>
)

export const LoadingState = ({ label = 'Loading…' }: { label?: string }) => (
  <View style={styles.stateBlock}>
    <ActivityIndicator size='small' color={colors.accent} />
    <Text style={[styles.stateMessage, { marginTop: spacing.sm }]}>{label}</Text>
  </View>
)

// ---------------------------------------------------------------------------
// Dashboard building blocks
// ---------------------------------------------------------------------------
export const SectionHeader = ({
  title,
  actionLabel,
  onAction
}: {
  title: string
  actionLabel?: string
  onAction?: () => void
}) => (
  <View style={styles.sectionHeader}>
    <H3>{title}</H3>
    {actionLabel && onAction && (
      <Pressable onPress={onAction} hitSlop={8}>
        <Text style={styles.sectionAction}>{actionLabel}</Text>
      </Pressable>
    )}
  </View>
)

export const StatCard = ({
  label,
  value,
  icon,
  tint = colors.primary,
  tintSurface = colors.surfaceAlt,
  style
}: {
  label: string
  value: string
  icon?: keyof typeof Ionicons.glyphMap
  tint?: string
  tintSurface?: string
  style?: StyleProp<ViewStyle>
}) => (
  <Card style={[{ flexGrow: 1, minWidth: '45%' }, style]}>
    <View style={styles.statCardTop}>
      {icon && (
        <View style={[styles.statIconWrap, { backgroundColor: tintSurface }]}>
          <Ionicons name={icon} size={16} color={tint} />
        </View>
      )}
      <Text style={styles.statLabel}>{label}</Text>
    </View>
    <Text style={styles.statValue}>{value}</Text>
  </Card>
)

export const QuickAction = ({
  icon,
  label,
  onPress,
  tint = colors.primary,
  tintSurface = colors.surfaceAlt
}: {
  icon: keyof typeof Ionicons.glyphMap
  label: string
  onPress: () => void
  tint?: string
  tintSurface?: string
}) => (
  <Pressable onPress={onPress} style={({ pressed }) => [styles.quickAction, { opacity: pressed ? 0.75 : 1 }]}>
    <View style={[styles.quickActionIcon, { backgroundColor: tintSurface }]}>
      <Ionicons name={icon} size={22} color={tint} />
    </View>
    <Text style={styles.quickActionLabel} numberOfLines={2}>
      {label}
    </Text>
  </Pressable>
)

export const ListRow = ({
  icon,
  tint = colors.primary,
  tintSurface = colors.surfaceAlt,
  title,
  subtitle,
  trailing,
  onPress
}: {
  icon?: keyof typeof Ionicons.glyphMap
  tint?: string
  tintSurface?: string
  title: string
  subtitle?: string
  trailing?: React.ReactNode
  onPress?: () => void
}) => {
  const Wrapper = onPress ? Pressable : View

  return (
    <Wrapper onPress={onPress} style={({ pressed }: any) => [styles.listRow, pressed && onPress ? { opacity: 0.7 } : null]}>
      {icon && (
        <View style={[styles.statIconWrap, { backgroundColor: tintSurface }]}>
          <Ionicons name={icon} size={16} color={tint} />
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text style={styles.listRowTitle}>{title}</Text>
        {subtitle && <Text style={styles.listRowSubtitle}>{subtitle}</Text>}
      </View>
      {trailing}
    </Wrapper>
  )
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  screenFlex: { flex: 1 },
  screenContent: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginVertical: spacing.xs },

  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoText: { fontFamily: fontFamily.headingExtraBold },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xxs,
    borderWidth: 1,
    borderColor: colors.border
  },

  field: { gap: spacing.xxs },
  label: { ...type.label, color: colors.textSecondary, marginBottom: 2 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    minHeight: touchTarget.min
  },
  inputWrapError: { borderColor: colors.danger },
  inputIcon: { marginRight: spacing.xxs },
  input: { flex: 1, ...type.bodyLg, color: colors.textPrimary, paddingVertical: spacing.sm },
  fieldError: { ...type.caption, color: colors.danger },

  button: {
    borderRadius: radius.sm,
    minHeight: touchTarget.min,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5
  },
  buttonInner: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  buttonText: { ...type.button },

  iconButton: { alignItems: 'center', justifyContent: 'center' },

  badge: { paddingHorizontal: spacing.xs, paddingVertical: 4, borderRadius: radius.pill, alignSelf: 'flex-start' },
  badgeText: { ...type.label, textTransform: 'capitalize' },

  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface
  },
  chipText: { ...type.bodyMedium, color: colors.textSecondary },

  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.dangerSurface,
    padding: spacing.sm,
    borderRadius: radius.sm
  },
  errorText: { color: colors.danger, ...type.body, flexShrink: 1 },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.infoSurface,
    padding: spacing.sm,
    borderRadius: radius.sm
  },
  infoTextContent: { color: colors.accentDark, ...type.body, flexShrink: 1 },

  stateBlock: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xl, gap: spacing.xxs },
  stateIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs
  },
  stateTitle: { ...type.h3, color: colors.textPrimary },
  stateMessage: { ...type.body, color: colors.textMuted, textAlign: 'center', maxWidth: 280 },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionAction: { ...type.bodyMedium, color: colors.accentDark },

  statCardTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  statIconWrap: { width: 32, height: 32, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  statLabel: { ...type.caption, color: colors.textMuted },
  statValue: { ...type.h2, color: colors.textPrimary, marginTop: 2 },

  quickAction: { width: '23%', alignItems: 'center', gap: spacing.xxs, minHeight: touchTarget.min + 36 },
  quickActionIcon: {
    width: 52,
    height: 52,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center'
  },
  quickActionLabel: { ...type.caption, color: colors.textSecondary, textAlign: 'center' },

  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    minHeight: touchTarget.min
  },
  listRowTitle: { ...type.bodyMedium, color: colors.textPrimary },
  listRowSubtitle: { ...type.caption, color: colors.textMuted, marginTop: 1 }
})

export { palette, radius, spacing, elevation, touchTarget, type as typeScale }
