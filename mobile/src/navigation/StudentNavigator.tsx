import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'

import AvailabilityListScreen from '../screens/student/AvailabilityListScreen'
import HotelAvailabilityScreen from '../screens/student/HotelAvailabilityScreen'
import MyBookingScreen from '../screens/student/MyBookingScreen'
import OrdersScreen from '../screens/student/OrdersScreen'
import FeedbackScreen from '../screens/student/FeedbackScreen'
import LogoutButton from '../components/LogoutButton'
import type { StudentAvailabilityStackParamList, StudentTabParamList } from './types'

const AvailabilityStack = createNativeStackNavigator<StudentAvailabilityStackParamList>()
const Tab = createBottomTabNavigator<StudentTabParamList>()

const AvailabilityStackNavigator = () => (
  <AvailabilityStack.Navigator screenOptions={{ headerRight: () => <LogoutButton /> }}>
    <AvailabilityStack.Screen name='Availability' component={AvailabilityListScreen} options={{ title: 'Browse' }} />
    <AvailabilityStack.Screen
      name='HotelAvailability'
      component={HotelAvailabilityScreen}
      options={({ route }) => ({ title: route.params.hotelName })}
    />
  </AvailabilityStack.Navigator>
)

const StudentNavigator = () => (
  <Tab.Navigator screenOptions={{ headerShown: false }}>
    <Tab.Screen name='AvailabilityTab' component={AvailabilityStackNavigator} options={{ title: 'Browse' }} />
    <Tab.Screen
      name='MyBooking'
      component={MyBookingScreen}
      options={{ headerShown: true, title: 'My Booking', headerRight: () => <LogoutButton /> }}
    />
    <Tab.Screen
      name='Orders'
      component={OrdersScreen}
      options={{ headerShown: true, title: 'Food Orders', headerRight: () => <LogoutButton /> }}
    />
    <Tab.Screen
      name='Feedback'
      component={FeedbackScreen}
      options={{ headerShown: true, headerRight: () => <LogoutButton /> }}
    />
  </Tab.Navigator>
)

export default StudentNavigator
