'use client'

import Typography from '@mui/material/Typography'

const features: { icon: string; label: string }[] = [
  { icon: 'ri-hotel-bed-line', label: 'Rooms & bed-level availability' },
  { icon: 'ri-calendar-check-line', label: 'Bookings, check-ins & check-outs' },
  { icon: 'ri-team-line', label: 'Staff, payroll & attendance' },
  { icon: 'ri-wallet-3-line', label: 'Expenses & guest billing' }
]

const AuthHero = ({ title, subtitle }: { title: string; subtitle: string }) => (
  <div
    className='flex-1 min-bs-[100dvh] relative p-12 max-md:hidden flex flex-col justify-center overflow-hidden'
    style={{
      background: 'linear-gradient(145deg, var(--mui-palette-primary-main), var(--mui-palette-primary-dark))'
    }}
  >
    {/* Decorative building-silhouette skyline, purely geometric so it never depends on external image assets */}
    <svg
      viewBox='0 0 400 180'
      className='absolute bottom-0 inline-start-0 is-full opacity-[0.12]'
      preserveAspectRatio='none'
      aria-hidden
    >
      <rect x='10' y='60' width='50' height='120' fill='white' />
      <rect x='70' y='30' width='60' height='150' fill='white' />
      <rect x='140' y='75' width='45' height='105' fill='white' />
      <rect x='195' y='15' width='65' height='165' fill='white' />
      <rect x='270' y='55' width='50' height='125' fill='white' />
      <rect x='330' y='40' width='60' height='140' fill='white' />
    </svg>

    <div className='relative z-10 max-is-[440px]'>
      <Typography variant='h3' className='font-extrabold' sx={{ color: 'white' }}>
        {title}
      </Typography>
      <Typography className='mbs-3' sx={{ color: 'rgba(255,255,255,0.85)' }}>
        {subtitle}
      </Typography>

      <div className='flex flex-col gap-3 mbs-10'>
        {features.map(f => (
          <div
            key={f.label}
            className='flex items-center gap-3 p-3 rounded-xl'
            style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)' }}
          >
            <div
              className='flex items-center justify-center is-10 bs-10 rounded-lg shrink-0'
              style={{ background: 'rgba(255,255,255,0.16)' }}
            >
              <i className={f.icon} style={{ color: 'white', fontSize: '1.25rem' }} />
            </div>
            <Typography sx={{ color: 'white' }}>{f.label}</Typography>
          </div>
        ))}
      </div>
    </div>
  </div>
)

export default AuthHero
