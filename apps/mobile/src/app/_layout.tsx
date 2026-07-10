// Root layout. Loads before any screen renders.

import '../../global.css'

import { Slot } from 'expo-router'

import { SessionProvider } from '@/lib/auth'

export default function RootLayout() {
  return (
    <SessionProvider>
      <Slot />
    </SessionProvider>
  )
}
