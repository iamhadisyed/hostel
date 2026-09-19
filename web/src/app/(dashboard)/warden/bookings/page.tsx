import type { Metadata } from 'next'

import BookingsView from '@/views/warden/BookingsView'

export const metadata: Metadata = {
  title: 'Bookings',
  description: 'Approve and manage guest bookings'
}

const WardenBookingsPage = () => <BookingsView />

export default WardenBookingsPage
