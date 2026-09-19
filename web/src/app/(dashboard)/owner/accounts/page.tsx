import type { Metadata } from 'next'

import AccountsView from '@/views/owner/AccountsView'

export const metadata: Metadata = {
  title: 'Accounts',
  description: 'Manage Warden and Front Desk accounts'
}

const OwnerAccountsPage = () => <AccountsView />

export default OwnerAccountsPage
