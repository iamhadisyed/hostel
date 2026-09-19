'use client'

import { useState } from 'react'

import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import Alert from '@mui/material/Alert'
import RadioGroup from '@mui/material/RadioGroup'
import FormControlLabel from '@mui/material/FormControlLabel'
import Radio from '@mui/material/Radio'

import { api, ApiError } from '@/libs/api'

type RoomTypeForm = { name: string; default_capacity: number; monthly_price: number; description: string }
type RoomForm = { room_number: string; room_type: string; capacity: number }
type FloorForm = { number: number; name: string; rooms: RoomForm[] }

const emptyRoomType = (): RoomTypeForm => ({ name: '', default_capacity: 1, monthly_price: 0, description: '' })
const emptyRoom = (): RoomForm => ({ room_number: '', room_type: '', capacity: 1 })
const emptyFloor = (n: number): FloorForm => ({ number: n, name: '', rooms: [emptyRoom()] })

const CreateHotelDialog = ({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) => {
  const [name, setName] = useState('')
  const [buildingType, setBuildingType] = useState<'flat' | 'house' | 'other'>('flat')
  const [city, setCity] = useState('')
  const [address, setAddress] = useState('')

  const [ownerMode, setOwnerMode] = useState<'new' | 'existing'>('new')
  const [ownerId, setOwnerId] = useState('')
  const [ownerName, setOwnerName] = useState('')
  const [ownerEmail, setOwnerEmail] = useState('')
  const [ownerPassword, setOwnerPassword] = useState('')

  const [roomTypes, setRoomTypes] = useState<RoomTypeForm[]>([emptyRoomType()])
  const [floors, setFloors] = useState<FloorForm[]>([emptyFloor(1)])

  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const reset = () => {
    setName('')
    setCity('')
    setAddress('')
    setOwnerMode('new')
    setOwnerId('')
    setOwnerName('')
    setOwnerEmail('')
    setOwnerPassword('')
    setRoomTypes([emptyRoomType()])
    setFloors([emptyFloor(1)])
    setError(null)
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const handleSubmit = async () => {
    setError(null)
    setSubmitting(true)

    const payload: Record<string, unknown> = {
      name,
      building_type: buildingType,
      city,
      address,
      floor_count: floors.length,
      room_types: roomTypes.map(rt => ({
        name: rt.name,
        default_capacity: Number(rt.default_capacity),
        monthly_price: Number(rt.monthly_price),
        description: rt.description || undefined
      })),
      floors: floors.map(f => ({
        number: f.number,
        name: f.name || undefined,
        rooms: f.rooms.map(r => ({
          room_number: r.room_number,
          room_type: r.room_type,
          capacity: Number(r.capacity)
        }))
      }))
    }

    if (ownerMode === 'existing') {
      payload.owner_id = Number(ownerId)
    } else {
      payload.owner = { name: ownerName, email: ownerEmail, password: ownerPassword }
    }

    try {
      await api.post('/hotels', payload)
      reset()
      onCreated()
    } catch (err) {
      if (err instanceof ApiError && err.errors) {
        setError(Object.values(err.errors).flat().join(' '))
      } else {
        setError(err instanceof ApiError ? err.message : 'Failed to create property.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const updateFloor = (idx: number, patch: Partial<FloorForm>) => {
    setFloors(prev => prev.map((f, i) => (i === idx ? { ...f, ...patch } : f)))
  }

  const updateRoom = (floorIdx: number, roomIdx: number, patch: Partial<RoomForm>) => {
    setFloors(prev =>
      prev.map((f, i) =>
        i === floorIdx ? { ...f, rooms: f.rooms.map((r, j) => (j === roomIdx ? { ...r, ...patch } : r)) } : f
      )
    )
  }

  const updateRoomType = (idx: number, patch: Partial<RoomTypeForm>) => {
    setRoomTypes(prev => prev.map((rt, i) => (i === idx ? { ...rt, ...patch } : rt)))
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth='md' fullWidth>
      <DialogTitle>Onboard New Property</DialogTitle>
      <DialogContent dividers className='flex flex-col gap-6'>
        {error && <Alert severity='error'>{error}</Alert>}

        <Typography variant='h6'>Property Details</Typography>
        <Grid container spacing={4}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField fullWidth label='Property Name' value={name} onChange={e => setName(e.target.value)} required />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              select
              fullWidth
              label='Building Type'
              value={buildingType}
              onChange={e => setBuildingType(e.target.value as typeof buildingType)}
            >
              <MenuItem value='flat'>Flat</MenuItem>
              <MenuItem value='house'>House</MenuItem>
              <MenuItem value='other'>Other</MenuItem>
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField fullWidth label='City' value={city} onChange={e => setCity(e.target.value)} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField fullWidth label='Address' value={address} onChange={e => setAddress(e.target.value)} />
          </Grid>
        </Grid>

        <Divider />
        <Typography variant='h6'>Owner</Typography>
        <RadioGroup row value={ownerMode} onChange={e => setOwnerMode(e.target.value as typeof ownerMode)}>
          <FormControlLabel value='new' control={<Radio />} label='Create new owner' />
          <FormControlLabel value='existing' control={<Radio />} label='Attach existing owner (by user ID)' />
        </RadioGroup>
        {ownerMode === 'new' ? (
          <Grid container spacing={4}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField fullWidth label='Owner Name' value={ownerName} onChange={e => setOwnerName(e.target.value)} />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                label='Owner Email'
                type='email'
                value={ownerEmail}
                onChange={e => setOwnerEmail(e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                label='Owner Password'
                type='password'
                value={ownerPassword}
                onChange={e => setOwnerPassword(e.target.value)}
              />
            </Grid>
          </Grid>
        ) : (
          <TextField
            fullWidth
            label='Existing Owner User ID'
            value={ownerId}
            onChange={e => setOwnerId(e.target.value)}
          />
        )}

        <Divider />
        <div className='flex items-center justify-between'>
          <Typography variant='h6'>Room Types & Pricing</Typography>
          <Button size='small' onClick={() => setRoomTypes(prev => [...prev, emptyRoomType()])}>
            + Add Room Type
          </Button>
        </div>
        {roomTypes.map((rt, idx) => (
          <Grid container spacing={2} key={idx} alignItems='center'>
            <Grid size={{ xs: 12, sm: 3 }}>
              <TextField
                fullWidth
                size='small'
                label='Name (e.g. Dorm-4)'
                value={rt.name}
                onChange={e => updateRoomType(idx, { name: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 2 }}>
              <TextField
                fullWidth
                size='small'
                type='number'
                label='Capacity'
                value={rt.default_capacity}
                onChange={e => updateRoomType(idx, { default_capacity: Number(e.target.value) })}
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <TextField
                fullWidth
                size='small'
                type='number'
                label='Monthly Price'
                value={rt.monthly_price}
                onChange={e => updateRoomType(idx, { monthly_price: Number(e.target.value) })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <TextField
                fullWidth
                size='small'
                label='Description'
                value={rt.description}
                onChange={e => updateRoomType(idx, { description: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 1 }}>
              <IconButton
                size='small'
                color='error'
                disabled={roomTypes.length === 1}
                onClick={() => setRoomTypes(prev => prev.filter((_, i) => i !== idx))}
              >
                <i className='ri-delete-bin-line' />
              </IconButton>
            </Grid>
          </Grid>
        ))}

        <Divider />
        <div className='flex items-center justify-between'>
          <Typography variant='h6'>Floors & Rooms</Typography>
          <Button size='small' onClick={() => setFloors(prev => [...prev, emptyFloor(prev.length + 1)])}>
            + Add Floor
          </Button>
        </div>
        {floors.map((floor, floorIdx) => (
          <div key={floorIdx} className='border rounded p-4 flex flex-col gap-3'>
            <div className='flex items-center gap-3 justify-between'>
              <div className='flex items-center gap-3'>
                <TextField
                  size='small'
                  type='number'
                  label='Floor #'
                  value={floor.number}
                  onChange={e => updateFloor(floorIdx, { number: Number(e.target.value) })}
                  className='is-24'
                />
                <TextField
                  size='small'
                  label='Floor Name (optional)'
                  value={floor.name}
                  onChange={e => updateFloor(floorIdx, { name: e.target.value })}
                />
              </div>
              <IconButton
                size='small'
                color='error'
                disabled={floors.length === 1}
                onClick={() => setFloors(prev => prev.filter((_, i) => i !== floorIdx))}
              >
                <i className='ri-delete-bin-line' />
              </IconButton>
            </div>

            {floor.rooms.map((room, roomIdx) => (
              <Grid container spacing={2} key={roomIdx} alignItems='center'>
                <Grid size={{ xs: 4, sm: 3 }}>
                  <TextField
                    fullWidth
                    size='small'
                    label='Room #'
                    value={room.room_number}
                    onChange={e => updateRoom(floorIdx, roomIdx, { room_number: e.target.value })}
                  />
                </Grid>
                <Grid size={{ xs: 4, sm: 4 }}>
                  <TextField
                    select
                    fullWidth
                    size='small'
                    label='Room Type'
                    value={room.room_type}
                    onChange={e => updateRoom(floorIdx, roomIdx, { room_type: e.target.value })}
                  >
                    {roomTypes.map((rt, i) => (
                      <MenuItem key={i} value={rt.name} disabled={!rt.name}>
                        {rt.name || '(unnamed)'}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 4, sm: 3 }}>
                  <TextField
                    fullWidth
                    size='small'
                    type='number'
                    label='Capacity (beds)'
                    value={room.capacity}
                    onChange={e => updateRoom(floorIdx, roomIdx, { capacity: Number(e.target.value) })}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 2 }}>
                  <IconButton
                    size='small'
                    color='error'
                    disabled={floor.rooms.length === 1}
                    onClick={() =>
                      updateFloor(floorIdx, { rooms: floor.rooms.filter((_, i) => i !== roomIdx) })
                    }
                  >
                    <i className='ri-delete-bin-line' />
                  </IconButton>
                </Grid>
              </Grid>
            ))}
            <Button size='small' onClick={() => updateFloor(floorIdx, { rooms: [...floor.rooms, emptyRoom()] })}>
              + Add Room
            </Button>
          </div>
        ))}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button variant='contained' onClick={handleSubmit} disabled={submitting}>
          {submitting ? 'Creating...' : 'Create Property'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default CreateHotelDialog
