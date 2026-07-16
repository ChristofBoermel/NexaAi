// Stack für die Post-Login-Routes.
// Wenn die Session fehlt, redirecten wir zurück zum Login.

import { Redirect, Stack } from 'expo-router'
import { View } from 'react-native'

import { useSession } from '@/lib/auth'

export default function AppLayout() {
  const { session, isLoading } = useSession()

  if (isLoading) {
    return <View className="flex-1 bg-white" />
  }

  if (!session) {
    return <Redirect href="/(auth)/login" />
  }

  return <Stack />
}
