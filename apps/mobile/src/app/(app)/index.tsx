// Landing nach Login. Aktuell nur Platzhalter.
// Onboarding (CV-Wizard, Skills-Auswahl) kommt in einem naechsten Step.

import { Pressable, Text, View } from 'react-native'

import { signOut, useSession } from '@/lib/auth'

export default function Home() {
  const { session } = useSession()

  const email = session?.user.email ?? ''

  return (
    <View className="flex-1 items-center justify-center bg-white px-6">
      <Text className="text-2xl font-bold text-neutral-900">Willkommen</Text>
      <Text className="mt-2 text-base text-neutral-600">{email}</Text>

      <Pressable
        onPress={() => signOut()}
        className="mt-8 rounded-lg bg-neutral-900 px-6 py-3"
      >
        <Text className="text-base font-semibold text-white">Abmelden</Text>
      </Pressable>
    </View>
  )
}
