import type { Metadata } from 'next'

import MyBookingView from '@/views/student/MyBookingView'

export const metadata: Metadata = {
  title: 'My Booking',
  description: 'View your booking, documents, and payment status'
}

const StudentBookingPage = () => <MyBookingView />

export default StudentBookingPage
