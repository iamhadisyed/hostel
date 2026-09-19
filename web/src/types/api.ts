export type Role = 'super_admin' | 'owner' | 'warden' | 'front_desk' | 'student'

export type User = {
  id: number
  name: string
  email: string | null
  email_verified_at: string | null
  role: Role
  hotel_id: number | null
  phone: string | null
  cnic: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export type Hotel = {
  id: number
  owner_id: number
  name: string
  building_type: 'flat' | 'house' | 'other'
  address: string | null
  city: string | null
  floor_count: number
  is_active: boolean
  owner?: User
  floors?: Floor[]
  room_types?: RoomType[]
}

export type Floor = {
  id: number
  hotel_id: number
  number: number
  name: string | null
  rooms?: Room[]
}

export type RoomType = {
  id: number
  hotel_id: number
  name: string
  default_capacity: number
  monthly_price: string
  description: string | null
}

export type Room = {
  id: number
  hotel_id: number
  floor_id: number
  room_type_id: number
  room_number: string
  capacity: number
  beds?: Bed[]
}

export type BedStatus = 'available' | 'held' | 'occupied'

export type Bed = {
  id: number
  hotel_id: number
  room_id: number
  bed_number: string
  status: BedStatus
}

export type Document = {
  id: number
  user_id: number
  type: 'cnic_front' | 'cnic_back' | 'b_form' | 'face_photo' | 'payment_proof' | 'expense_receipt'
  path: string
  disk: string
}

export type AvailabilityRoomType = {
  id: number
  name: string
  monthly_price: string
  description: string | null
  total_beds: number
  available_beds: number
  rooms: {
    id: number
    room_number: string
    beds: { id: number; bed_number: string; status: BedStatus }[]
  }[]
}

export type BookingStatus = 'pending' | 'approved' | 'rejected' | 'active' | 'checked_out' | 'cancelled'

export type Booking = {
  id: number
  hotel_id: number
  user_id: number
  room_type_id: number
  room_id: number | null
  bed_id: number | null
  status: BookingStatus
  created_by: 'self' | 'front_desk' | 'warden' | 'owner'
  verification_method: 'otp' | 'in_person'
  check_in_date: string | null
  check_out_date: string | null
  is_recurring: boolean
  guest?: User
  room?: Room
  bed?: Bed
  room_type?: RoomType
  cycles?: BookingCycle[]
}

export type BookingCycle = {
  id: number
  booking_id: number
  period_start: string
  period_end: string
  amount: string
  status: 'pending_payment' | 'paid' | 'expired'
  voucher?: Voucher
}

export type Voucher = {
  id: number
  booking_cycle_id: number
  voucher_number: string
  amount: string
  due_date: string
  status: 'pending' | 'paid' | 'expired' | 'cancelled'
  payments?: Payment[]
}

export type Payment = {
  id: number
  voucher_id: number
  amount: string
  proof_path: string
  status: 'pending' | 'approved' | 'rejected'
  rejection_reason: string | null
}

export type Staff = {
  id: number
  hotel_id: number
  user_id: number | null
  name: string
  designation: string
  wage_type: 'daily' | 'monthly'
  rate: string
  is_active: boolean
}

export type Attendance = {
  id: number
  staff_id: number
  date: string
  status: 'present' | 'absent' | 'half_day' | 'leave'
}

export type Payroll = {
  id: number
  staff_id: number
  period_start: string
  period_end: string
  gross_amount: string
  total_deductions: string
  total_advances: string
  net_amount: string
  status: 'pending' | 'paid'
  slip_path: string | null
  deductions?: PayrollDeduction[]
}

export type PayrollDeduction = {
  id: number
  payroll_id: number
  type: 'deduction' | 'advance' | 'loan_repayment'
  amount: string
  note: string | null
}

export type ExpenseStatus = 'pending' | 'approved' | 'rejected'

export type Expense = {
  id: number
  hotel_id: number
  category: 'vendor_payment' | 'utility' | 'maintenance' | 'other'
  vendor: string | null
  amount: string
  date: string
  receipt_path: string | null
  status: ExpenseStatus
  logged_by: number
  approved_by: number | null
  rejection_reason: string | null
}

export type MenuItem = {
  id: number
  hotel_id: number
  name: string
  description: string | null
  price: string
  is_available: boolean
}

export type OrderStatus = 'pending' | 'preparing' | 'delivered'

export type Order = {
  id: number
  booking_id: number
  status: OrderStatus
  payment_status: 'unpaid' | 'paid'
  total: string
  items?: OrderItem[]
}

export type OrderItem = {
  id: number
  order_id: number
  menu_item_id: number
  quantity: number
  unit_price: string
  menu_item?: MenuItem
}

export type Feedback = {
  id: number
  booking_id: number
  hotel_id: number
  room_id: number | null
  rating: number
  comment: string | null
}

export type AnalyticsSummary = {
  period: { from: string; to: string }
  revenue: number
  payroll_total: number
  expenses_total: number
  net_savings: number
  occupancy_rate: number | null
  average_stay_days: number | null
  pricing_performance: {
    room_type: string
    monthly_price: string
    occupied_beds: number
    total_beds: number
  }[]
}

export type AuditLogEntry = {
  id: number
  user_id: number | null
  role: string | null
  hotel_id: number | null
  action: string
  auditable_type: string | null
  auditable_id: number | null
  before: Record<string, unknown> | null
  after: Record<string, unknown> | null
  created_at: string
  user?: User
}

export type PresenceLog = {
  id: number
  booking_id: number
  type: 'check_in' | 'check_out'
  logged_at: string
}

export type VisitorPass = {
  id: number
  hotel_id: number
  visitor_name: string
  cnic: string | null
  phone: string | null
  host_booking_id: number | null
  purpose: string | null
  checked_in_at: string
  checked_out_at: string | null
}
