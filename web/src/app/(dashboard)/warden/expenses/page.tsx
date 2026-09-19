import type { Metadata } from 'next'

import ExpensesView from '@/views/shared/ExpensesView'

export const metadata: Metadata = {
  title: 'Expenses',
  description: 'Log property expenses'
}

const WardenExpensesPage = () => <ExpensesView />

export default WardenExpensesPage
