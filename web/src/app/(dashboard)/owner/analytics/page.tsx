import type { Metadata } from 'next'

import AnalyticsView from '@/views/owner/AnalyticsView'

export const metadata: Metadata = {
  title: 'Analytics',
  description: 'Cross-property analytics dashboard'
}

const OwnerAnalyticsPage = () => <AnalyticsView />

export default OwnerAnalyticsPage
