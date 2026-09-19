export type AuthStackParamList = {
  Login: undefined
  Register: undefined
}

export type SuperAdminStackParamList = {
  Hotels: undefined
  CreateHotel: undefined
}

export type OwnerTabParamList = {
  Analytics: undefined
  Bookings: undefined
  Staff: undefined
  Payroll: undefined
  Expenses: undefined
  Menu: undefined
  Accounts: undefined
}

export type WardenTabParamList = {
  Bookings: undefined
  Staff: undefined
  Payroll: undefined
  Expenses: undefined
  Menu: undefined
}

export type FrontDeskStackParamList = {
  Bookings: undefined
  WalkIn: { hotelId: number }
}

export type FrontDeskTabParamList = {
  BookingsTab: undefined
  Visitors: undefined
}

export type StudentAvailabilityStackParamList = {
  Availability: undefined
  HotelAvailability: { hotelId: number; hotelName: string }
}

export type StudentTabParamList = {
  AvailabilityTab: undefined
  MyBooking: undefined
  Orders: undefined
  Feedback: undefined
}

// Kept as an alias so screens can import the combined param list they
// actually navigate within (the nested Availability stack).
export type StudentStackParamList = StudentAvailabilityStackParamList
