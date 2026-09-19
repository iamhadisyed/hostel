'use client'

import type { ReactNode } from 'react'

import RoleGuard from '@/components/auth/RoleGuard'

const FrontDeskLayout = ({ children }: { children: ReactNode }) => (
  <RoleGuard allow={['front_desk', 'warden', 'owner', 'super_admin']}>{children}</RoleGuard>
)

export default FrontDeskLayout
