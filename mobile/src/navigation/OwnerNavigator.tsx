import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'

import AnalyticsScreen from '../screens/owner/AnalyticsScreen'
import AccountsScreen from '../screens/owner/AccountsScreen'
import BookingsScreen from '../screens/warden/BookingsScreen'
import StaffScreen from '../screens/warden/StaffScreen'
import PayrollScreen from '../screens/warden/PayrollScreen'
import MenuScreen from '../screens/warden/MenuScreen'
import ExpensesScreen from '../screens/shared/ExpensesScreen'
import LogoutButton from '../components/LogoutButton'
import type { OwnerTabParamList } from './types'

const Tab = createBottomTabNavigator<OwnerTabParamList>()

const OwnerNavigator = () => (
  <Tab.Navigator screenOptions={{ headerRight: () => <LogoutButton /> }}>
    <Tab.Screen name='Analytics' component={AnalyticsScreen} />
    <Tab.Screen name='Bookings' component={BookingsScreen} />
    <Tab.Screen name='Staff' component={StaffScreen} />
    <Tab.Screen name='Payroll' component={PayrollScreen} />
    <Tab.Screen name='Expenses' component={ExpensesScreen} />
    <Tab.Screen name='Menu' component={MenuScreen} options={{ title: 'Food Menu' }} />
    <Tab.Screen name='Accounts' component={AccountsScreen} />
  </Tab.Navigator>
)

export default OwnerNavigator
