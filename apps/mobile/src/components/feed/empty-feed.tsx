// Empty state for the feed. Editorial layout: caption eyebrow + display heading
// + muted body, sparkles icon left-aligned. Cream backdrop matches the deck.

import { View } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

import { brand } from '@/lib/colors'
import { Button } from '@/components/ui/button'
import { Text } from '@/components/ui/text'

export function EmptyFeed() {
  const router = useRouter()

  return (
    <View className="flex-1 items-center justify-center bg-cream-50 px-8">
      <View className="w-full items-start">
        <Ionicons name="sparkles-outline" size={40} color={brand[300]} />
        <View className="mt-6">
          <Text variant="caption">Für heute war’s das</Text>
        </View>
        <View className="mt-3">
          <Text variant="display">Alle Jobs angeschaut.</Text>
        </View>
        <View className="mt-3">
          <Text variant="muted">
            Wir melden uns, sobald neue passende Angebote reinkommen.
          </Text>
        </View>
      </View>
      <View className="mt-12 w-full">
        <Button onPress={() => router.replace('/(app)')}>Zur Startseite</Button>
      </View>
    </View>
  )
}
