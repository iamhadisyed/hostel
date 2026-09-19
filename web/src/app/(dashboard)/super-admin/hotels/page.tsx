import type { Metadata } from 'next'

import HotelsView from '@/views/super-admin/HotelsView'

export const metadata: Metadata = {
  title: 'Properties',
  description: 'Manage all properties'
}

const SuperAdminHotelsPage = () => <HotelsView />

export default SuperAdminHotelsPage
