'use client'

import { useEffect, useState } from 'react'

import { api } from '@/libs/api'
import { useAuth } from '@/contexts/AuthContext'
import type { Hotel } from '@/types/api'

/**
 * Resolves the hotel(s) the current user can act on, and a selected
 * hotel id. Owners may have several properties and can switch between
 * them; Warden/Front Desk are scoped to their single assigned hotel.
 */
export const useMyHotels = () => {
  const { user } = useAuth()
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [selectedHotelId, setSelectedHotelId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    const load = async () => {
      setLoading(true)

      try {
        const data = await api.get<Hotel[]>('/hotels')

        setHotels(data)
        setSelectedHotelId(prev => prev ?? data[0]?.id ?? null)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [user])

  return { hotels, selectedHotelId, setSelectedHotelId, loading }
}
