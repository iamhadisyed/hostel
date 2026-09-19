'use client'

import { useEffect, useState } from 'react'

import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'
import Chip from '@mui/material/Chip'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import IconButton from '@mui/material/IconButton'
import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'

import { api, ApiError } from '@/libs/api'
import type { Booking, MenuItem, Order } from '@/types/api'

const OrdersView = () => {
  const [booking, setBooking] = useState<Booking | null>(null)
  const [menu, setMenu] = useState<MenuItem[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [cart, setCart] = useState<Record<number, number>>({})
  const [payNow, setPayNow] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const load = async () => {
    setLoading(true)
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
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

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

  if (loading) {
    return (
      <div className='flex justify-center p-8'>
        <CircularProgress />
      </div>
    )
  }

  if (!booking) {
    return <Alert severity='info'>Food ordering is available once your stay is active.</Alert>
  }

  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <Typography variant='h4'>Food Orders</Typography>
      </Grid>

      {error && (
        <Grid size={{ xs: 12 }}>
          <Alert severity='error'>{error}</Alert>
        </Grid>
      )}

      <Grid size={{ xs: 12, md: 7 }}>
        <Card>
          <CardHeader title='Menu' />
          <CardContent>
            <Table size='small'>
              <TableBody>
                {menu.map(item => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Typography>{item.name}</Typography>
                      <Typography variant='caption' color='text.secondary'>
                        Rs. {item.price}
                      </Typography>
                    </TableCell>
                    <TableCell align='right'>
                      <IconButton
                        size='small'
                        onClick={() => setCart(c => ({ ...c, [item.id]: Math.max(0, (c[item.id] ?? 0) - 1) }))}
                      >
                        <i className='ri-subtract-line' />
                      </IconButton>
                      {cart[item.id] ?? 0}
                      <IconButton size='small' onClick={() => setCart(c => ({ ...c, [item.id]: (c[item.id] ?? 0) + 1 }))}>
                        <i className='ri-add-line' />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {menu.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={2} className='text-center'>
                      No menu items available.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <FormControlLabel
              control={<Checkbox checked={payNow} onChange={e => setPayNow(e.target.checked)} />}
              label='Pay now (cash on delivery) instead of adding to my checkout tab'
            />
            <Button variant='contained' onClick={placeOrder} disabled={submitting}>
              {submitting ? 'Placing order...' : 'Place Order'}
            </Button>
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, md: 5 }}>
        <Card>
          <CardHeader title='Order History' />
          <CardContent>
            {orders.map(order => (
              <div key={order.id} className='flex items-center justify-between border-be pbe-2 mbe-2'>
                <div>
                  <Typography variant='body2'>Order #{order.id}</Typography>
                  <Typography variant='caption' color='text.secondary'>
                    {order.items?.map(i => `${i.quantity}x ${i.menu_item?.name}`).join(', ')}
                  </Typography>
                </div>
                <div className='flex flex-col items-end gap-1'>
                  <Chip size='small' label={order.status} className='capitalize' />
                  <Typography variant='caption'>
                    Rs. {order.total} - {order.payment_status}
                  </Typography>
                </div>
              </div>
            ))}
            {orders.length === 0 && <Typography color='text.secondary'>No orders yet.</Typography>}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

export default OrdersView
