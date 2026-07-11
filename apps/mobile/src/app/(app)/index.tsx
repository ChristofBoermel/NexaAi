// Landing nach Login. Aktuell Placeholder.
// Onboarding (CV-Wizard, Skills-Auswahl) kommt in einem naechsten Step.

import { ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { signOut, useSession } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { LogoMark } from '@/components/ui/logo-mark'
import { Text } from '@/components/ui/text'

export default function Home() {
  const { session } = useSession()
  const email = session?.user.email ?? ''

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 24,
          paddingVertical: 32,
        }}
      >
        <View className="flex-1">
          <View className="items-center">
            <LogoMark size="md" />
          </View>

          <View className="mt-10">
            <Text variant="heading">Willkommen</Text>
          </View>
          <View className="mt-2">
            <Text variant="muted">{email}</Text>
          </View>

          <View className="mt-10">
            <Text variant="subheading">Dein Profil ist fast fertig</Text>
            <View className="mt-3">
              <Text variant="body">
                Wir sammeln in den naechsten Schritten deine Daten und erstellen daraus einen Lebenslauf. Der Onboarding-Assistent kommt in Kuerze.
              </Text>
            </View>
          </View>

          <View className="mt-auto pt-6">
            <Button variant="ghost" onPress={() => signOut()}>
              Abmelden
            </Button>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
