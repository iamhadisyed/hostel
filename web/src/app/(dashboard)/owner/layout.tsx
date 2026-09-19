'use client'

import type { ReactNode } from 'react'

import RoleGuard from '@/components/auth/RoleGuard'

const OwnerLayout = ({ children }: { children: ReactNode }) => (
  <RoleGuard allow={['owner', 'super_admin']}>{children}</RoleGuard>
)

export default OwnerLayout
