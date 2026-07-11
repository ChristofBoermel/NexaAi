// Stack fuer die Auth-Routes (login, register).
// Wenn bereits eine Session existiert, gehen wir direkt zu /(app).
// Damit sieht ein eingeloggter User nie den Login-Screen.

import { Redirect, Stack } from 'expo-router'
import { View } from 'react-native'

import { useSession } from '@/lib/auth'

export default function AuthLayout() {
  const { session, isLoading } = useSession()

  if (isLoading) {
    return <View className="flex-1 bg-white" />
  }

  if (session) {
    return <Redirect href="/(app)" />
  }

  return <Stack screenOptions={{ headerShown: false }} />
}
