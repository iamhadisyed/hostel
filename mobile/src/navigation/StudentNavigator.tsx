import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { Ionicons } from '@expo/vector-icons'

import AvailabilityListScreen from '../screens/student/AvailabilityListScreen'
import HotelAvailabilityScreen from '../screens/student/HotelAvailabilityScreen'
import MyBookingScreen from '../screens/student/MyBookingScreen'
import OrdersScreen from '../screens/student/OrdersScreen'
import FeedbackScreen from '../screens/student/FeedbackScreen'
import LogoutButton from '../components/LogoutButton'
import { stackScreenOptions, tabScreenOptions } from './navigationTheme'
import type { StudentAvailabilityStackParamList, StudentTabParamList } from './types'

const AvailabilityStack = createNativeStackNavigator<StudentAvailabilityStackParamList>()
const Tab = createBottomTabNavigator<StudentTabParamList>()

const ICONS: Record<keyof StudentTabParamList, keyof typeof Ionicons.glyphMap> = {
  AvailabilityTab: 'search-outline',
  MyBooking: 'bed-outline',
  Orders: 'restaurant-outline',
  Feedback: 'star-outline'
}

const AvailabilityStackNavigator = () => (
  <AvailabilityStack.Navigator screenOptions={{ ...stackScreenOptions, headerRight: () => <LogoutButton /> }}>
    <AvailabilityStack.Screen name='Availability' component={AvailabilityListScreen} options={{ title: 'Browse' }} />
    <AvailabilityStack.Screen
      name='HotelAvailability'
      component={HotelAvailabilityScreen}
      options={({ route }) => ({ title: route.params.hotelName })}
    />
  </AvailabilityStack.Navigator>
)

const StudentNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      ...tabScreenOptions,
      headerShown: false,
      tabBarIcon: ({ color, size }) => <Ionicons name={ICONS[route.name as keyof StudentTabParamList]} color={color} size={size} />
    })}
  >
    <Tab.Screen name='AvailabilityTab' component={AvailabilityStackNavigator} options={{ title: 'Browse' }} />
    <Tab.Screen
      name='MyBooking'
      component={MyBookingScreen}
      options={{ ...stackScreenOptions, headerShown: true, title: 'My Booking', headerRight: () => <LogoutButton /> }}
    />
    <Tab.Screen
      name='Orders'
      component={OrdersScreen}
      options={{ ...stackScreenOptions, headerShown: true, title: 'Food Orders', headerRight: () => <LogoutButton /> }}
    />
    <Tab.Screen
      name='Feedback'
      component={FeedbackScreen}
      options={{ ...stackScreenOptions, headerShown: true, headerRight: () => <LogoutButton /> }}
    />
  </Tab.Navigator>
)

export default StudentNavigator
