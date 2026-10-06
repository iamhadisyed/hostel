import type { Metadata } from 'next'

import Register from '@views/Register'

import themeConfig from '@configs/themeConfig'

export const metadata: Metadata = {
  title: 'Register',
  description: 'Create a guest account'
}

const RegisterPage = () => {
  return <Register mode={themeConfig.mode} />
}

export default RegisterPage
