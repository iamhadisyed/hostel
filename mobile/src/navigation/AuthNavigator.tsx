import React, { useEffect, useState } from 'react'
import { View } from 'react-native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'

import OnboardingScreen from '../screens/auth/OnboardingScreen'
import LoginScreen from '../screens/auth/LoginScreen'
import RegisterScreen from '../screens/auth/RegisterScreen'
import { LoadingState, colors } from '../components/ui'
import { hasSeenOnboarding } from '../libs/onboarding'
import type { AuthStackParamList } from './types'

const Stack = createNativeStackNavigator<AuthStackParamList>()

const AuthNavigator = () => {
  const [initialRoute, setInitialRoute] = useState<keyof AuthStackParamList | null>(null)

  useEffect(() => {
    hasSeenOnboarding().then(seen => setInitialRoute(seen ? 'Login' : 'Onboarding'))
  }, [])

  if (!initialRoute) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', backgroundColor: colors.background }}>
        <LoadingState />
      </View>
    )
  }

  return (
    <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
      <Stack.Screen name='Onboarding' component={OnboardingScreen} />
      <Stack.Screen name='Login' component={LoginScreen} />
      <Stack.Screen name='Register' component={RegisterScreen} />
    </Stack.Navigator>
  )
}

export default AuthNavigator
