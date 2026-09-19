import React from 'react'
import { ActivityIndicator, View } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'

import { useAuth } from '../contexts/AuthContext'
import AuthNavigator from './AuthNavigator'
import SuperAdminNavigator from './SuperAdminNavigator'
import OwnerNavigator from './OwnerNavigator'
import WardenNavigator from './WardenNavigator'
import FrontDeskNavigator from './FrontDeskNavigator'
import StudentNavigator from './StudentNavigator'

const RootNavigator = () => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size='large' />
      </View>
    )
  }

  const renderRoleNavigator = () => {
    if (!user) return <AuthNavigator />

    switch (user.role) {
      case 'super_admin':
        return <SuperAdminNavigator />
      case 'owner':
        return <OwnerNavigator />
      case 'warden':
        return <WardenNavigator />
      case 'front_desk':
        return <FrontDeskNavigator />
      case 'student':
      default:
        return <StudentNavigator />
    }
  }

  return <NavigationContainer>{renderRoleNavigator()}</NavigationContainer>
}

export default RootNavigator
