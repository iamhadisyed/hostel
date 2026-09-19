import type { Metadata } from 'next'

import StaffView from '@/views/warden/StaffView'

export const metadata: Metadata = {
  title: 'Staff',
  description: 'Manage staff and attendance'
}

const WardenStaffPage = () => <StaffView />

export default WardenStaffPage
