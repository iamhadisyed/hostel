import { useEffect, useState } from 'react'

import { api } from '../libs/api'
import { useAuth } from '../contexts/AuthContext'
import type { Hotel } from '../types/api'

export const useMyHotels = () => {
  const { user } = useAuth()
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [selectedHotelId, setSelectedHotelId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  const reload = async () => {
    if (!user) return

    setLoading(true)

    try {
      const data = await api.get<Hotel[]>('/hotels')

      setHotels(data)
      setSelectedHotelId(prev => prev ?? data[0]?.id ?? null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  return { hotels, selectedHotelId, setSelectedHotelId, loading, reload }
}
