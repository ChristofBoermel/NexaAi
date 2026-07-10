// Root index acts as a gate: while the session state is loading we render nothing
// (the splash screen stays visible). Once loaded we redirect based on session.

import { Redirect } from 'expo-router'
import { View } from 'react-native'

import { useSession } from '@/lib/auth'

export default function Index() {
  const { session, isLoading } = useSession()

  if (isLoading) {
    return <View className="flex-1 bg-white" />
  }

  if (session) {
    return <Redirect href="/(app)" />
  }

  return <Redirect href="/(auth)/login" />
}
