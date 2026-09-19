'use client'

import type { ReactNode } from 'react'

import RoleGuard from '@/components/auth/RoleGuard'

const WardenLayout = ({ children }: { children: ReactNode }) => (
  <RoleGuard allow={['warden', 'owner', 'super_admin']}>{children}</RoleGuard>
)

export default WardenLayout
