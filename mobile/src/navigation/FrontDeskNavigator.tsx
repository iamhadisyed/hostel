import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { Ionicons } from '@expo/vector-icons'

import FrontDeskBookingsScreen from '../screens/front-desk/FrontDeskBookingsScreen'
import WalkInScreen from '../screens/front-desk/WalkInScreen'
import VisitorsScreen from '../screens/front-desk/VisitorsScreen'
import LogoutButton from '../components/LogoutButton'
import { stackScreenOptions, tabScreenOptions } from './navigationTheme'
import type { FrontDeskStackParamList, FrontDeskTabParamList } from './types'

const BookingsStack = createNativeStackNavigator<FrontDeskStackParamList>()
const Tab = createBottomTabNavigator<FrontDeskTabParamList>()

const ICONS: Record<keyof FrontDeskTabParamList, keyof typeof Ionicons.glyphMap> = {
  BookingsTab: 'calendar-outline',
  Visitors: 'person-add-outline'
}

const BookingsStackNavigator = () => (
  <BookingsStack.Navigator screenOptions={{ ...stackScreenOptions, headerRight: () => <LogoutButton /> }}>
    <BookingsStack.Screen name='Bookings' component={FrontDeskBookingsScreen} options={{ title: 'Bookings' }} />
    <BookingsStack.Screen name='WalkIn' component={WalkInScreen} options={{ title: 'Walk-in Guest' }} />
  </BookingsStack.Navigator>
)

const FrontDeskNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      ...tabScreenOptions,
      headerShown: false,
      tabBarIcon: ({ color, size }) => <Ionicons name={ICONS[route.name as keyof FrontDeskTabParamList]} color={color} size={size} />
    })}
  >
    <Tab.Screen name='BookingsTab' component={BookingsStackNavigator} options={{ title: 'Bookings' }} />
    <Tab.Screen
      name='Visitors'
      component={VisitorsScreen}
      options={{ ...stackScreenOptions, headerShown: true, headerRight: () => <LogoutButton /> }}
    />
  </Tab.Navigator>
)

export default FrontDeskNavigator
