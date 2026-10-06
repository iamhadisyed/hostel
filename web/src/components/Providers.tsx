// Type Imports
import type { ChildrenType, Direction } from '@core/types'

// Context Imports
import { VerticalNavProvider } from '@menu/contexts/verticalNavContext'
import { SettingsProvider } from '@core/contexts/settingsContext'
import ThemeProvider from '@components/theme'
import { AuthProvider } from '@/contexts/AuthContext'

type Props = ChildrenType & {
  direction: Direction
}

// Theme mode/settings are resolved client-side (see SettingsProvider and
// ThemeProvider) so this component needs no server-side cookie reads,
// keeping it compatible with `output: 'export'`.
const Providers = (props: Props) => {
  // Props
  const { children, direction } = props

  return (
    <VerticalNavProvider>
      <SettingsProvider>
        <ThemeProvider direction={direction}>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </SettingsProvider>
    </VerticalNavProvider>
  )
}

export default Providers
