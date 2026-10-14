import { colors } from '../components/ui'
import { fontFamily } from '../theme/tokens'

// Not explicitly typed as NativeStackNavigationOptions/BottomTabNavigationOptions
// on purpose — both navigators accept this common subset, but their `header`
// callback signatures are mutually incompatible, which breaks structural
// typing the moment either specific type is named here.
export const stackScreenOptions = {
  headerStyle: { backgroundColor: colors.primary },
  headerTintColor: colors.white,
  headerTitleStyle: { fontFamily: fontFamily.headingSemibold, fontSize: 17 },
  headerShadowVisible: false,
  contentStyle: { backgroundColor: colors.background }
}

export const tabScreenOptions = {
  ...stackScreenOptions,
  tabBarActiveTintColor: colors.accentDark,
  tabBarInactiveTintColor: colors.textMuted,
  tabBarStyle: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    height: 60,
    paddingBottom: 8,
    paddingTop: 6
  },
  tabBarLabelStyle: { fontFamily: fontFamily.bodyMedium, fontSize: 11 }
}
