import type { Metadata } from 'next'

import VisitorsView from '@/views/front-desk/VisitorsView'

export const metadata: Metadata = {
  title: 'Visitors',
  description: 'Log visitor passes'
}

const FrontDeskVisitorsPage = () => <VisitorsView />

export default FrontDeskVisitorsPage
