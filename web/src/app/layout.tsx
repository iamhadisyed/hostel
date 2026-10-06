// MUI Imports
import InitColorSchemeScript from '@mui/material/InitColorSchemeScript'

// Third-party Imports
import 'react-perfect-scrollbar/dist/css/styles.css'

// Type Imports
import type { ChildrenType } from '@core/types'

// Config Imports
import themeConfig from '@configs/themeConfig'

// Style Imports
import '@/app/globals.css'

// Generated Icon CSS Imports
import '@assets/iconify-icons/generated-icons.css'

export const metadata = {
  title: 'Materialize - Material Next.js Admin Template',
  description: 'Materialize - Material Next.js Admin Template'
}

const RootLayout = (props: ChildrenType) => {
  const { children } = props

  // Vars
  const direction = 'ltr'

  return (
    <html id='__next' lang='en' dir={direction} suppressHydrationWarning>
      <body className='flex is-full min-bs-full flex-auto flex-col'>
        {/* InitColorSchemeScript runs client-side before paint, resolving the
            'system' default via prefers-color-scheme - no cookie/server needed. */}
        <InitColorSchemeScript attribute='data' defaultMode={themeConfig.mode} />
        {children}
      </body>
    </html>
  )
}

export default RootLayout
