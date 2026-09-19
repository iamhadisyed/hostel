import type { Metadata } from 'next'

import PayrollView from '@/views/warden/PayrollView'

export const metadata: Metadata = {
  title: 'Payroll',
  description: 'Generate and pay staff salaries'
}

const WardenPayrollPage = () => <PayrollView />

export default WardenPayrollPage
