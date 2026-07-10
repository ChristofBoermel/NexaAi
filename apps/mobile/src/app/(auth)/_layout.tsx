// Stack fuer die Auth-Routes (login, register).
// Header ist aus: die Screens haben ihren eigenen Titel-Text.

import { Stack } from 'expo-router'

export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false }} />
}
