import type { Metadata } from 'next'

import MenuView from '@/views/warden/MenuView'

export const metadata: Metadata = {
  title: 'Food Menu',
  description: 'Manage the food menu'
}

const WardenMenuPage = () => <MenuView />

export default WardenMenuPage
