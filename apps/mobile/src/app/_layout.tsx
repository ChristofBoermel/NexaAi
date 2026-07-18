// Root layout. Loads before any screen renders.

import '../../global.css'

import { Slot } from 'expo-router'

import { SessionProvider } from '@/lib/auth'
import { initSentry, withSentryRoot } from '@/lib/sentry'
import { ErrorBoundary } from '@/components/ui/error-boundary'

initSentry()

function RootLayout() {
  return (
    <ErrorBoundary>
      <SessionProvider>
        <Slot />
      </SessionProvider>
    </ErrorBoundary>
  )
}

export default withSentryRoot(RootLayout)
