import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Ionicons } from '@expo/vector-icons'

import BookingsScreen from '../screens/warden/BookingsScreen'
import StaffScreen from '../screens/warden/StaffScreen'
import PayrollScreen from '../screens/warden/PayrollScreen'
import ExpensesScreen from '../screens/shared/ExpensesScreen'
import MenuScreen from '../screens/warden/MenuScreen'
import LogoutButton from '../components/LogoutButton'
import { tabScreenOptions } from './navigationTheme'
import type { WardenTabParamList } from './types'

const Tab = createBottomTabNavigator<WardenTabParamList>()

const ICONS: Record<keyof WardenTabParamList, keyof typeof Ionicons.glyphMap> = {
  Bookings: 'calendar-outline',
  Staff: 'people-outline',
  Payroll: 'card-outline',
  Expenses: 'wallet-outline',
  Menu: 'restaurant-outline'
}

const WardenNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      ...tabScreenOptions,
      headerRight: () => <LogoutButton />,
      tabBarIcon: ({ color, size }) => <Ionicons name={ICONS[route.name as keyof WardenTabParamList]} color={color} size={size} />
    })}
  >
    <Tab.Screen name='Bookings' component={BookingsScreen} />
    <Tab.Screen name='Staff' component={StaffScreen} />
    <Tab.Screen name='Payroll' component={PayrollScreen} />
    <Tab.Screen name='Expenses' component={ExpensesScreen} />
    <Tab.Screen name='Menu' component={MenuScreen} options={{ title: 'Food Menu' }} />
  </Tab.Navigator>
)

export default WardenNavigator
