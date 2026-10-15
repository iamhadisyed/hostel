import type { Metadata } from 'next'

import DashboardView from '@/views/super-admin/DashboardView'

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Super Admin overview'
}

const SuperAdminDashboardPage = () => <DashboardView />

export default SuperAdminDashboardPage
