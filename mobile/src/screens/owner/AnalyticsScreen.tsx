import React, { useCallback, useMemo, useState } from 'react'
import { View } from 'react-native'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs'

import {
  Card,
  Divider,
  EmptyState,
  ErrorState,
  H1,
  ListRow,
  LoadingState,
  Muted,
  QuickAction,
  Screen,
  SectionHeader,
  StatCard,
  colors
} from '../../components/ui'
import { spacing } from '../../theme/tokens'
import { api, ApiError } from '../../libs/api'
import type { AnalyticsSummary, Booking } from '../../types/api'
import type { OwnerTabParamList } from '../../navigation/types'

const startOfMonth = () => new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10)
const endOfMonth = () => new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().slice(0, 10)
const today = () => new Date().toISOString().slice(0, 10)

const AnalyticsScreen = () => {
  const navigation = useNavigation<BottomTabNavigationProp<OwnerTabParamList>>()
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setError(null)

    try {
      const params = new URLSearchParams({ from: startOfMonth(), to: endOfMonth() })
      const [summaryData, bookingsData] = await Promise.all([
        api.get<AnalyticsSummary>(`/analytics/summary?${params.toString()}`),
        api.get<Booking[]>('/bookings')
      ])

      setSummary(summaryData)
      setBookings(bookingsData)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load dashboard.')
    } finally {
      setLoading(false)
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      load()
    }, [load])
  )

  const { arrivals, departures } = useMemo(() => {
    const t = today()

    return {
      arrivals: bookings.filter(b => b.check_in_date === t && (b.status === 'approved' || b.status === 'active')),
      departures: bookings.filter(b => b.check_out_date === t && b.status === 'active')
    }
  }, [bookings])

  if (loading) {
    return (
      <Screen>
        <LoadingState label='Loading your dashboard…' />
      </Screen>
    )
  }

  if (error && !summary) {
    return (
      <Screen>
        <ErrorState message={error} onRetry={load} />
      </Screen>
    )
  }

  return (
    <Screen>
      <View>
        <H1>Dashboard</H1>
        <Muted>This month, across all your properties</Muted>
      </View>

      {summary && (
        <>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            <StatCard
              label='Occupancy'
              value={summary.occupancy_rate !== null ? `${summary.occupancy_rate}%` : '—'}
              icon='bed-outline'
              tint={colors.accentDark}
              tintSurface={colors.accentSurface}
            />
            <StatCard
              label='Revenue'
              value={`Rs. ${summary.revenue.toLocaleString()}`}
              icon='trending-up-outline'
              tint={colors.primary}
              tintSurface={colors.surfaceAlt}
            />
            <StatCard
              label="Today's Arrivals"
              value={String(arrivals.length)}
              icon='log-in-outline'
              tint={colors.success}
              tintSurface={colors.successSurface}
            />
            <StatCard
              label="Today's Departures"
              value={String(departures.length)}
              icon='log-out-outline'
              tint={colors.gold}
              tintSurface={colors.goldSurface}
            />
          </View>

          <SectionHeader title='Quick Actions' />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'space-between' }}>
            <QuickAction icon='calendar-outline' label='Bookings' onPress={() => navigation.navigate('Bookings')} />
            <QuickAction
              icon='people-outline'
              label='Staff'
              onPress={() => navigation.navigate('Staff')}
              tint={colors.accentDark}
              tintSurface={colors.accentSurface}
            />
            <QuickAction
              icon='card-outline'
              label='Payroll'
              onPress={() => navigation.navigate('Payroll')}
              tint={colors.gold}
              tintSurface={colors.goldSurface}
            />
            <QuickAction
              icon='wallet-outline'
              label='Expenses'
              onPress={() => navigation.navigate('Expenses')}
              tint={colors.danger}
              tintSurface={colors.dangerSurface}
            />
          </View>

          {(arrivals.length > 0 || departures.length > 0) && (
            <Card>
              <SectionHeader title="Today's Activity" />
              <Divider />
              {arrivals.map(b => (
                <ListRow
                  key={`arr-${b.id}`}
                  icon='log-in-outline'
                  tint={colors.success}
                  tintSurface={colors.successSurface}
                  title={b.guest?.name ?? `Guest #${b.user_id}`}
                  subtitle={`Arriving · Room ${b.room?.room_number ?? '—'}`}
                />
              ))}
              {departures.map(b => (
                <ListRow
                  key={`dep-${b.id}`}
                  icon='log-out-outline'
                  tint={colors.gold}
                  tintSurface={colors.goldSurface}
                  title={b.guest?.name ?? `Guest #${b.user_id}`}
                  subtitle={`Departing · Room ${b.room?.room_number ?? '—'}`}
                />
              ))}
            </Card>
          )}

          <Card>
            <SectionHeader title='Finance Summary' />
            <Divider />
            <ListRow title='Payroll burn' subtitle='This month' trailing={<Muted>{`Rs. ${summary.payroll_total.toLocaleString()}`}</Muted>} />
            <ListRow title='Expenses' subtitle='This month' trailing={<Muted>{`Rs. ${summary.expenses_total.toLocaleString()}`}</Muted>} />
            <ListRow
              title='Net savings'
              subtitle='Revenue minus payroll & expenses'
              trailing={<Muted>{`Rs. ${summary.net_savings.toLocaleString()}`}</Muted>}
            />
            <ListRow
              title='Average stay'
              subtitle='Per guest, this month'
              trailing={<Muted>{summary.average_stay_days !== null ? `${summary.average_stay_days} days` : '—'}</Muted>}
            />
          </Card>

          <Card>
            <SectionHeader title='Pricing Performance' />
            <Divider />
            {summary.pricing_performance.length === 0 ? (
              <EmptyState icon='pricetag-outline' title='No room types yet' message='Add room types to see pricing performance here.' />
            ) : (
              summary.pricing_performance.map((rt, idx) => (
                <ListRow
                  key={idx}
                  icon='home-outline'
                  title={rt.room_type}
                  subtitle={`Rs. ${rt.monthly_price} / month`}
                  trailing={<Muted>{`${rt.occupied_beds}/${rt.total_beds} beds`}</Muted>}
                />
              ))
            )}
          </Card>
        </>
      )}
    </Screen>
  )
}

export default AnalyticsScreen
