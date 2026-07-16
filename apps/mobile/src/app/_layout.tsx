// Root layout. Loads before any screen renders.

import '../../global.css'

import { Slot } from 'expo-router'

import { SessionProvider } from '@/lib/auth'
import { ErrorBoundary } from '@/components/ui/error-boundary'

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <SessionProvider>
        <Slot />
      </SessionProvider>
    </ErrorBoundary>
  )
}
