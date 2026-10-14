import React, { useRef, useState } from 'react'
import { Dimensions, FlatList, Pressable, StyleSheet, Text, View, type NativeSyntheticEvent, type NativeScrollEvent } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'

import { Button, Logo, colors } from '../../components/ui'
import { brand, fontFamily, radius, spacing, type } from '../../theme/tokens'
import { markOnboardingSeen } from '../../libs/onboarding'
import type { AuthStackParamList } from '../../navigation/types'

type Props = NativeStackScreenProps<AuthStackParamList, 'Onboarding'>

const { width } = Dimensions.get('window')

const SLIDES: { icon: keyof typeof Ionicons.glyphMap; title: string; body: string }[] = [
  {
    icon: 'business-outline',
    title: 'Run every property from one app',
    body: 'Floors, rooms, and beds for every hotel or hostel you manage, always in sync.'
  },
  {
    icon: 'calendar-outline',
    title: 'Never miss a check-in',
    body: 'Approve bookings and track arrivals and departures the moment they happen.'
  },
  {
    icon: 'card-outline',
    title: 'Payroll, expenses, vouchers',
    body: 'Keep staff pay, expenses, and guest billing clear across every property.'
  }
]

const OnboardingScreen = ({ navigation }: Props) => {
  const [index, setIndex] = useState(0)
  const listRef = useRef<FlatList>(null)

  const finish = async () => {
    await markOnboardingSeen()
    navigation.replace('Login')
  }

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(e.nativeEvent.contentOffset.x / width)

    if (next !== index) setIndex(next)
  }

  const goNext = () => {
    if (index === SLIDES.length - 1) {
      finish()

      return
    }

    listRef.current?.scrollToIndex({ index: index + 1, animated: true })
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={[colors.primary, colors.primaryDark]} style={StyleSheet.absoluteFill} />

      <View style={styles.header}>
        <Logo size={28} variant='light' />
        {index < SLIDES.length - 1 && (
          <Pressable onPress={finish} hitSlop={8} accessibilityRole='button' accessibilityLabel='Skip onboarding'>
            <Text style={styles.skip}>Skip</Text>
          </Pressable>
        )}
      </View>

      <FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={(_, i) => String(i)}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            <View style={styles.iconBackdrop}>
              <Ionicons name={item.icon} size={56} color={colors.white} />
            </View>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.body}>{item.body}</Text>
          </View>
        )}
      />

      <View style={styles.footer}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>

        {index === SLIDES.length - 1 && <Text style={styles.tagline}>{brand.tagline}</Text>}

        <Button
          title={index === SLIDES.length - 1 ? 'Get Started' : 'Next'}
          variant='accent'
          icon={index === SLIDES.length - 1 ? 'arrow-forward' : undefined}
          onPress={goNext}
        />
      </View>
    </View>
  )
}

export default OnboardingScreen

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.sm
  },
  skip: { ...type.bodyMedium, color: colors.white, opacity: 0.85 },
  slide: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl },
  iconBackdrop: {
    width: 120,
    height: 120,
    borderRadius: radius.xl,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl
  },
  title: {
    fontFamily: fontFamily.headingExtraBold,
    fontSize: 24,
    lineHeight: 31,
    color: colors.white,
    textAlign: 'center',
    marginBottom: spacing.xs
  },
  body: { ...type.bodyLg, color: 'rgba(255,255,255,0.78)', textAlign: 'center', maxWidth: 300 },
  footer: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, gap: spacing.md },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: spacing.xs },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.3)' },
  dotActive: { backgroundColor: colors.accent, width: 20 },
  tagline: { ...type.bodyMedium, color: 'rgba(255,255,255,0.9)', textAlign: 'center' }
})
