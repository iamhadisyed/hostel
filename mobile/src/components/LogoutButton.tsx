import React from 'react'
import { Pressable, Text } from 'react-native'

import { useAuth } from '../contexts/AuthContext'

const LogoutButton = () => {
  const { logout } = useAuth()

  return (
    <Pressable onPress={() => logout()} style={{ paddingHorizontal: 8 }}>
      <Text style={{ color: '#7367F0', fontWeight: '600' }}>Logout</Text>
    </Pressable>
  )
}

export default LogoutButton
