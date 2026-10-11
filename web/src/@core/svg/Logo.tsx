// React Imports
import type { SVGAttributes } from 'react'

const Logo = (props: SVGAttributes<SVGElement>) => {
  return (
    <svg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg' {...props}>
      <path
        d='M3 7.5C3 5.01472 5.01472 3 7.5 3H16.5C18.9853 3 21 5.01472 21 7.5V20C21 20.5523 20.5523 21 20 21H4C3.44772 21 3 20.5523 3 20V7.5Z'
        fill='var(--mui-palette-primary-main)'
      />
      <path
        d='M3 7.5C3 5.01472 5.01472 3 7.5 3H16.5C18.9853 3 21 5.01472 21 7.5V9H3V7.5Z'
        fill='var(--mui-palette-primary-dark)'
      />
      <rect x='6.5' y='11' width='4' height='4' rx='1' fill='white' />
      <rect x='13.5' y='11' width='4' height='4' rx='1' fill='white' />
      <path d='M7 21V18C7 16.8954 7.89543 16 9 16H15C16.1046 16 17 16.8954 17 18V21H7Z' fill='white' />
    </svg>
  )
}

export default Logo
