import type { Metadata } from 'next'

import BillingView from '@/views/owner/BillingView'

export const metadata: Metadata = {
  title: 'Billing',
  description: 'Your subscription plan and payment history'
}

const OwnerBillingPage = () => <BillingView />

export default OwnerBillingPage
