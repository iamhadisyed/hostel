import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'

import HotelsListScreen from '../screens/super-admin/HotelsListScreen'
import CreateHotelScreen from '../screens/super-admin/CreateHotelScreen'
import LogoutButton from '../components/LogoutButton'
import type { SuperAdminStackParamList } from './types'

const Stack = createNativeStackNavigator<SuperAdminStackParamList>()

const SuperAdminNavigator = () => (
  <Stack.Navigator screenOptions={{ headerRight: () => <LogoutButton /> }}>
    <Stack.Screen name='Hotels' component={HotelsListScreen} options={{ title: 'Properties' }} />
    <Stack.Screen name='CreateHotel' component={CreateHotelScreen} options={{ title: 'Onboard Property' }} />
  </Stack.Navigator>
)

export default SuperAdminNavigator
