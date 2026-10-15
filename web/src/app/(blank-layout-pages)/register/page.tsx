import type { Metadata } from 'next'

import Register from '@views/Register'

export const metadata: Metadata = {
  title: 'Register',
  description: 'Create a guest account'
}

const RegisterPage = () => {
  return <Register />
}

export default RegisterPage
