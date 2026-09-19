import type { Metadata } from 'next'

import AvailabilityView from '@/views/student/AvailabilityView'

export const metadata: Metadata = {
  title: 'Availability',
  description: 'Browse room and seat availability'
}

const StudentAvailabilityPage = () => <AvailabilityView />

export default StudentAvailabilityPage
