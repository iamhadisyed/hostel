import React, { useCallback, useState } from 'react'
import { View } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'

import { Card, ErrorText, H1, H2, Muted, Screen } from '../../components/ui'
import { api, ApiError } from '../../libs/api'
import type { AnalyticsSummary } from '../../types/api'

const startOfMonth = () => new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10)
const endOfMonth = () => new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().slice(0, 10)

const StatCard = ({ label, value }: { label: string; value: string }) => (
  <Card style={{ flexGrow: 1, minWidth: '45%' }}>
    <Muted>{label}</Muted>
    <H2>{value}</H2>
  </Card>
)

const AnalyticsScreen = () => {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setError(null)

    try {
      const params = new URLSearchParams({ from: startOfMonth(), to: endOfMonth() })
      const data = await api.get<AnalyticsSummary>(`/analytics/summary?${params.toString()}`)

      setSummary(data)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load analytics.')
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      load()
    }, [load])
  )

  return (
    <Screen>
      <H1>Analytics</H1>
      <Muted>This month, across all your properties</Muted>

      <ErrorText>{error}</ErrorText>

      {summary && (
        <>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            <StatCard label='Revenue' value={`Rs. ${summary.revenue.toLocaleString()}`} />
            <StatCard label='Payroll Burn' value={`Rs. ${summary.payroll_total.toLocaleString()}`} />
            <StatCard label='Expenses' value={`Rs. ${summary.expenses_total.toLocaleString()}`} />
            <StatCard label='Net Savings' value={`Rs. ${summary.net_savings.toLocaleString()}`} />
            <StatCard label='Occupancy' value={summary.occupancy_rate !== null ? `${summary.occupancy_rate}%` : '-'} />
            <StatCard label='Avg. Stay' value={summary.average_stay_days !== null ? `${summary.average_stay_days} days` : '-'} />
          </View>

          <Card>
            <H2>Pricing Performance</H2>
            {summary.pricing_performance.map((rt, idx) => (
              <View key={idx} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
                <Muted>{rt.room_type}</Muted>
                <Muted>
                  {rt.occupied_beds}/{rt.total_beds} beds - Rs. {rt.monthly_price}
                </Muted>
              </View>
            ))}
          </Card>
        </>
      )}
    </Screen>
  )
}

export default AnalyticsScreen
