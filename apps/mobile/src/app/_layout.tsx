// Root layout. Loads before any screen renders.
// Order matters: the localStorage polyfill must run before Supabase reads the
// stored session, so we import it first (bare side-effect import).

import 'expo-sqlite/localStorage/install'
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
