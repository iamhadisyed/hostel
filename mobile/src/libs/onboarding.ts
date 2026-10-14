import AsyncStorage from '@react-native-async-storage/async-storage'

const ONBOARDING_KEY = 'staypilot_onboarding_seen'

export const hasSeenOnboarding = async (): Promise<boolean> => {
  const value = await AsyncStorage.getItem(ONBOARDING_KEY)

  return value === '1'
}

export const markOnboardingSeen = async (): Promise<void> => {
  await AsyncStorage.setItem(ONBOARDING_KEY, '1')
}
