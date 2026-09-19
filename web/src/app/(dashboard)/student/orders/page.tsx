import type { Metadata } from 'next'

import OrdersView from '@/views/student/OrdersView'

export const metadata: Metadata = {
  title: 'Food Orders',
  description: 'Order food during your stay'
}

const StudentOrdersPage = () => <OrdersView />

export default StudentOrdersPage
