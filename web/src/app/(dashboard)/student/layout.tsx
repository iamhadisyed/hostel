'use client'

import type { ReactNode } from 'react'

import RoleGuard from '@/components/auth/RoleGuard'

const StudentLayout = ({ children }: { children: ReactNode }) => <RoleGuard allow={['student']}>{children}</RoleGuard>

export default StudentLayout
