import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'

import FrontDeskBookingsScreen from '../screens/front-desk/FrontDeskBookingsScreen'
import WalkInScreen from '../screens/front-desk/WalkInScreen'
import VisitorsScreen from '../screens/front-desk/VisitorsScreen'
import LogoutButton from '../components/LogoutButton'
import type { FrontDeskStackParamList, FrontDeskTabParamList } from './types'

const BookingsStack = createNativeStackNavigator<FrontDeskStackParamList>()
const Tab = createBottomTabNavigator<FrontDeskTabParamList>()

const BookingsStackNavigator = () => (
  <BookingsStack.Navigator screenOptions={{ headerRight: () => <LogoutButton /> }}>
    <BookingsStack.Screen name='Bookings' component={FrontDeskBookingsScreen} options={{ title: 'Bookings' }} />
    <BookingsStack.Screen name='WalkIn' component={WalkInScreen} options={{ title: 'Walk-in Guest' }} />
  </BookingsStack.Navigator>
)

const FrontDeskNavigator = () => (
  <Tab.Navigator screenOptions={{ headerShown: false }}>
    <Tab.Screen name='BookingsTab' component={BookingsStackNavigator} options={{ title: 'Bookings' }} />
    <Tab.Screen
      name='Visitors'
      component={VisitorsScreen}
      options={{ headerShown: true, headerRight: () => <LogoutButton /> }}
    />
  </Tab.Navigator>
)

export default FrontDeskNavigator
