import React, { useCallback, useEffect } from 'react'
import { StatusBar } from 'expo-status-bar'
import * as SplashScreen from 'expo-splash-screen'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'

import { AuthProvider } from './src/contexts/AuthContext'
import RootNavigator from './src/navigation/RootNavigator'
import { useAppFonts } from './src/theme/fonts'

SplashScreen.preventAutoHideAsync().catch(() => {
  // no-op: harmless if it was already hidden/not supported on this platform
})

export default function App() {
  const [fontsLoaded, fontError] = useAppFonts()

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded || fontError) {
      await SplashScreen.hideAsync()
    }
  }, [fontsLoaded, fontError])

  useEffect(() => {
    onLayoutRootView()
  }, [onLayoutRootView])

  if (!fontsLoaded && !fontError) {
    return null
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <RootNavigator />
        </AuthProvider>
        <StatusBar style='light' />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}
