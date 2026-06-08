import React from 'react'
import './styles.css'

export const metadata = {
  description:
    'Registration for The Girlie Run hosted by oneseventycadence in collaboration with Nada',
  title: 'oneseventycadence - The Girlie Run',
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="en">
      <body>
        <main>{children}</main>
      </body>
    </html>
  )
}
