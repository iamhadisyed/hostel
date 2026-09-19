import type { Metadata } from 'next'

import ExpensesView from '@/views/shared/ExpensesView'

export const metadata: Metadata = {
  title: 'Expenses',
  description: 'Manage property expenses'
}

const OwnerExpensesPage = () => <ExpensesView />

export default OwnerExpensesPage
