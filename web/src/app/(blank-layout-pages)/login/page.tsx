// Next Imports
import type { Metadata } from 'next'

// Component Imports
import Login from '@views/Login'

// Config Imports
import themeConfig from '@configs/themeConfig'

export const metadata: Metadata = {
  title: 'Login',
  description: 'Login to your account'
}

const LoginPage = () => {
  return <Login mode={themeConfig.mode} />
}

export default LoginPage
