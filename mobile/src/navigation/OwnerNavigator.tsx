import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Ionicons } from '@expo/vector-icons'

import AnalyticsScreen from '../screens/owner/AnalyticsScreen'
import AccountsScreen from '../screens/owner/AccountsScreen'
import BookingsScreen from '../screens/warden/BookingsScreen'
import StaffScreen from '../screens/warden/StaffScreen'
import PayrollScreen from '../screens/warden/PayrollScreen'
import MenuScreen from '../screens/warden/MenuScreen'
import ExpensesScreen from '../screens/shared/ExpensesScreen'
import LogoutButton from '../components/LogoutButton'
import { tabScreenOptions } from './navigationTheme'
import type { OwnerTabParamList } from './types'

const Tab = createBottomTabNavigator<OwnerTabParamList>()

const ICONS: Record<keyof OwnerTabParamList, keyof typeof Ionicons.glyphMap> = {
  Analytics: 'bar-chart-outline',
  Bookings: 'calendar-outline',
  Staff: 'people-outline',
  Payroll: 'card-outline',
  Expenses: 'wallet-outline',
  Menu: 'restaurant-outline',
  Accounts: 'business-outline'
}

const OwnerNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      ...tabScreenOptions,
      headerRight: () => <LogoutButton />,
      tabBarIcon: ({ color, size }) => <Ionicons name={ICONS[route.name as keyof OwnerTabParamList]} color={color} size={size} />
    })}
  >
    <Tab.Screen name='Analytics' component={AnalyticsScreen} options={{ title: 'Dashboard' }} />
    <Tab.Screen name='Bookings' component={BookingsScreen} />
    <Tab.Screen name='Staff' component={StaffScreen} />
    <Tab.Screen name='Payroll' component={PayrollScreen} />
    <Tab.Screen name='Expenses' component={ExpensesScreen} />
    <Tab.Screen name='Menu' component={MenuScreen} options={{ title: 'Food Menu' }} />
    <Tab.Screen name='Accounts' component={AccountsScreen} />
  </Tab.Navigator>
)

export default OwnerNavigator
