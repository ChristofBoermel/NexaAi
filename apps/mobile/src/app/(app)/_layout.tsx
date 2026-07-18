// Stack für die Post-Login-Routes.
// Wenn die Session fehlt, redirecten wir zurück zum Login.

import { useEffect } from 'react'
import { Redirect, Stack, useRouter } from 'expo-router'
import { View } from 'react-native'

import { useSession } from '@/lib/auth'
import { subscribeNotificationResponses } from '@/lib/push'

export default function AppLayout() {
  const router = useRouter()
  const { session, isLoading } = useSession()

  useEffect(() => {
    if (!session) return
    return subscribeNotificationResponses(router)
  }, [router, session])

  if (isLoading) {
    return <View className="flex-1 bg-white" />
  }

  if (!session) {
    return <Redirect href="/(auth)/login" />
  }

  return <Stack />
}
