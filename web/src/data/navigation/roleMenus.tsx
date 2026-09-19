import type { Role } from '@/types/api'

export type NavItem = { label: string; href: string; icon: string }

export const roleMenus: Record<Role, NavItem[]> = {
  super_admin: [{ label: 'Properties', href: '/super-admin/hotels', icon: 'ri-building-line' }],
  owner: [
    { label: 'Analytics', href: '/owner/analytics', icon: 'ri-bar-chart-box-line' },
    { label: 'Expenses', href: '/owner/expenses', icon: 'ri-wallet-3-line' },
    { label: 'Accounts', href: '/owner/accounts', icon: 'ri-team-line' },
    { label: 'Bookings', href: '/warden/bookings', icon: 'ri-hotel-bed-line' },
    { label: 'Staff', href: '/warden/staff', icon: 'ri-user-star-line' },
    { label: 'Payroll', href: '/warden/payroll', icon: 'ri-money-dollar-circle-line' },
    { label: 'Food Menu', href: '/warden/menu', icon: 'ri-restaurant-line' }
  ],
  warden: [
    { label: 'Bookings', href: '/warden/bookings', icon: 'ri-hotel-bed-line' },
    { label: 'Staff', href: '/warden/staff', icon: 'ri-user-star-line' },
    { label: 'Payroll', href: '/warden/payroll', icon: 'ri-money-dollar-circle-line' },
    { label: 'Expenses', href: '/warden/expenses', icon: 'ri-wallet-3-line' },
    { label: 'Food Menu', href: '/warden/menu', icon: 'ri-restaurant-line' }
  ],
  front_desk: [
    { label: 'Bookings', href: '/front-desk/bookings', icon: 'ri-hotel-bed-line' },
    { label: 'Visitors', href: '/front-desk/visitors', icon: 'ri-user-follow-line' }
  ],
  student: [
    { label: 'Availability', href: '/student/availability', icon: 'ri-search-line' },
    { label: 'My Booking', href: '/student/booking', icon: 'ri-hotel-bed-line' },
    { label: 'Food Orders', href: '/student/orders', icon: 'ri-restaurant-line' },
    { label: 'Feedback', href: '/student/feedback', icon: 'ri-star-line' }
  ]
}
