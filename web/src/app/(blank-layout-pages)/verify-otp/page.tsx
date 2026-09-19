import type { Metadata } from 'next'

import VerifyOtp from '@views/VerifyOtp'

export const metadata: Metadata = {
  title: 'Verify Email',
  description: 'Verify your email with an OTP code'
}

const VerifyOtpPage = () => <VerifyOtp />

export default VerifyOtpPage
