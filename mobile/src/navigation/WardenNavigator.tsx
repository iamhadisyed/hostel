import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'

import BookingsScreen from '../screens/warden/BookingsScreen'
import StaffScreen from '../screens/warden/StaffScreen'
import PayrollScreen from '../screens/warden/PayrollScreen'
import ExpensesScreen from '../screens/shared/ExpensesScreen'
import MenuScreen from '../screens/warden/MenuScreen'
import LogoutButton from '../components/LogoutButton'
import type { WardenTabParamList } from './types'

const Tab = createBottomTabNavigator<WardenTabParamList>()

const WardenNavigator = () => (
  <Tab.Navigator screenOptions={{ headerRight: () => <LogoutButton /> }}>
    <Tab.Screen name='Bookings' component={BookingsScreen} />
    <Tab.Screen name='Staff' component={StaffScreen} />
    <Tab.Screen name='Payroll' component={PayrollScreen} />
    <Tab.Screen name='Expenses' component={ExpensesScreen} />
    <Tab.Screen name='Menu' component={MenuScreen} options={{ title: 'Food Menu' }} />
  </Tab.Navigator>
)

export default WardenNavigator
