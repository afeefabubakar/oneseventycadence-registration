import React from 'react'
import './styles.css'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })

export const metadata = {
  description: 'Registration for events hosted by oneseventycadence.',
  title: 'Event Registration | oneseventycadence',
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body>
        <main>{children}</main>
      </body>
    </html>
  )
}
