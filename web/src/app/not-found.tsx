// Component Imports
import Providers from '@components/Providers'
import BlankLayout from '@layouts/BlankLayout'
import NotFound from '@views/NotFound'

// Config Imports
import themeConfig from '@configs/themeConfig'

// Static fallback for the initial paint only (no server/cookie available
// under static export); BlankLayout/useLayoutInit/ModeChanger correct the
// live value client-side immediately after mount.
const FALLBACK_SYSTEM_MODE = themeConfig.mode === 'dark' ? 'dark' : 'light'

const NotFoundPage = () => {
  // Vars
  const direction = 'ltr'

  return (
    <Providers direction={direction}>
      <BlankLayout systemMode={FALLBACK_SYSTEM_MODE}>
        <NotFound mode={themeConfig.mode} />
      </BlankLayout>
    </Providers>
  )
}

export default NotFoundPage
