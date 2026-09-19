import type { Metadata } from 'next'

import FrontDeskBookingsView from '@/views/front-desk/FrontDeskBookingsView'

export const metadata: Metadata = {
  title: 'Bookings',
  description: 'Register walk-in guests'
}

const FrontDeskBookingsPage = () => <FrontDeskBookingsView />

export default FrontDeskBookingsPage
