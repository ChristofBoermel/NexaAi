// Empty state for the feed. Shown after the seeker has swiped through every
// pending match. Copy softens the "empty" feeling with a promise of new jobs.

import { View } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

import { brand } from '@/lib/colors'
import { Button } from '@/components/ui/button'
import { Text } from '@/components/ui/text'

export function EmptyFeed() {
  const router = useRouter()

  return (
    <View className="flex-1 items-center justify-center bg-white px-6">
      <Ionicons name="sparkles-outline" size={48} color={brand[300]} />
      <View className="mt-6 items-center">
        <Text variant="heading">Alle Jobs angeschaut</Text>
      </View>
      <View className="mt-2 items-center">
        <Text variant="muted">
          Wir melden uns, sobald neue passende Angebote reinkommen.
        </Text>
      </View>
      <View className="mt-8 w-full">
        <Button onPress={() => router.replace('/(app)')}>Zur Startseite</Button>
      </View>
    </View>
  )
}
