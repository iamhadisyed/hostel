import React, { useCallback, useState } from 'react'
import { Switch, View } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'

import { Badge, Button, Card, ErrorText, H1, H2, Muted, Screen } from '../../components/ui'
import { api, ApiError } from '../../libs/api'
import type { Booking, MenuItem, Order } from '../../types/api'

const OrdersScreen = () => {
  const [booking, setBooking] = useState<Booking | null>(null)
  const [menu, setMenu] = useState<MenuItem[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [cart, setCart] = useState<Record<number, number>>({})
  const [payNow, setPayNow] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const load = useCallback(async () => {
    setError(null)

    try {
      const bookings = await api.get<Booking[]>('/bookings')
      const activeBooking = bookings.find(b => b.status === 'active') ?? null

      setBooking(activeBooking)

      if (activeBooking) {
        const [menuData, orderData] = await Promise.all([
          api.get<MenuItem[]>(`/hotels/${activeBooking.hotel_id}/menu`),
          api.get<Order[]>(`/bookings/${activeBooking.id}/orders`)
        ])

        setMenu(menuData.filter(m => m.is_available))
        setOrders(orderData)
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load food menu.')
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      load()
    }, [load])
  )

  const placeOrder = async () => {
    if (!booking) return

    const items = Object.entries(cart)
      .filter(([, qty]) => qty > 0)
      .map(([menuItemId, quantity]) => ({ menu_item_id: Number(menuItemId), quantity }))

    if (items.length === 0) return

    setSubmitting(true)
    setError(null)

    try {
      await api.post('/orders', { booking_id: booking.id, pay_now: payNow, items })
      setCart({})
      load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to place order.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!booking) {
    return (
      <Screen>
        <H1>Food Orders</H1>
        <Muted>Food ordering is available once your stay is active.</Muted>
      </Screen>
    )
  }

  return (
    <Screen>
      <H1>Food Orders</H1>
      <ErrorText>{error}</ErrorText>

      <Card>
        <H2>Menu</H2>
        {menu.map(item => (
          <View key={item.id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Muted>{item.name}</Muted>
              <Muted>Rs. {item.price}</Muted>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Button
                title='-'
                variant='outline'
                onPress={() => setCart(c => ({ ...c, [item.id]: Math.max(0, (c[item.id] ?? 0) - 1) }))}
                style={{ paddingHorizontal: 12, paddingVertical: 4 }}
              />
              <Muted>{cart[item.id] ?? 0}</Muted>
              <Button
                title='+'
                variant='outline'
                onPress={() => setCart(c => ({ ...c, [item.id]: (c[item.id] ?? 0) + 1 }))}
                style={{ paddingHorizontal: 12, paddingVertical: 4 }}
              />
            </View>
          </View>
        ))}
        {menu.length === 0 && <Muted>No menu items available.</Muted>}

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Switch value={payNow} onValueChange={setPayNow} />
          <Muted>Pay now (cash on delivery) instead of adding to my checkout tab</Muted>
        </View>

        <Button title='Place Order' onPress={placeOrder} loading={submitting} />
      </Card>

      <Card>
        <H2>Order History</H2>
        {orders.map(order => (
          <View key={order.id} style={{ paddingVertical: 4 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Muted>Order #{order.id}</Muted>
              <Badge label={order.status} />
            </View>
            <Muted>
              {order.items?.map(i => `${i.quantity}x ${i.menu_item?.name}`).join(', ')} - Rs. {order.total} ({order.payment_status})
            </Muted>
          </View>
        ))}
        {orders.length === 0 && <Muted>No orders yet.</Muted>}
      </Card>
    </Screen>
  )
}

export default OrdersScreen
