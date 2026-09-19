'use client'

import type { ReactNode } from 'react'

import RoleGuard from '@/components/auth/RoleGuard'

const SuperAdminLayout = ({ children }: { children: ReactNode }) => (
  <RoleGuard allow={['super_admin']}>{children}</RoleGuard>
)

export default SuperAdminLayout
