import React from 'react'
import { Pressable } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

import { useAuth } from '../contexts/AuthContext'
import { colors } from './ui'

const LogoutButton = () => {
  const { logout } = useAuth()

  return (
    <Pressable
      onPress={() => logout()}
      hitSlop={8}
      accessibilityRole='button'
      accessibilityLabel='Log out'
      style={{ paddingHorizontal: 12, height: 44, alignItems: 'center', justifyContent: 'center' }}
    >
      <Ionicons name='log-out-outline' size={22} color={colors.white} />
    </Pressable>
  )
}

export default LogoutButton
