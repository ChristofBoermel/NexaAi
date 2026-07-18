// Match notification: quiet editorial reveal, not fake fireworks.
// Cream backdrop, caption eyebrow, display headline, then a single soft
// info card that unblurs the company. Chat CTA disabled until chat chunk.

import { View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

import { brand, neutral } from '@/lib/colors'
import { useMatchDetail } from '@/lib/jobs'
import { Button } from '@/components/ui/button'
import { LogoMark } from '@/components/ui/logo-mark'
import { Skeleton } from '@/components/ui/skeleton'
import { Text } from '@/components/ui/text'

export default function MatchScreen() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const { match, isLoading } = useMatchDetail(id)

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-cream-50">
        <View className="flex-1 justify-center px-8 gap-4">
          <Skeleton width={140} height={16} />
          <Skeleton width="80%" height={54} />
          <Skeleton width="60%" height={20} />
        </View>
      </SafeAreaView>
    )
  }

  if (!match) {
    return (
      <SafeAreaView className="flex-1 bg-cream-50">
        <View className="flex-1 items-center justify-center px-8">
          <Text variant="heading">Match nicht gefunden</Text>
          <View className="mt-6 w-full">
            <Button onPress={() => router.replace('/(app)/feed')}>
              Zurück zum Feed
            </Button>
          </View>
        </View>
      </SafeAreaView>
    )
  }

  const company = match.job.company

  return (
    <SafeAreaView className="flex-1 bg-cream-50">
      <View className="flex-1 px-8 pt-6">
        <View className="items-start">
          <LogoMark size="sm" />
        </View>

        <View className="mt-14 flex-row items-center gap-2">
          <Ionicons name="sparkles" size={16} color={brand[800]} />
          <Text variant="caption">Neues Match</Text>
        </View>
        <View className="mt-3">
          <Text variant="display">Ihr passt zusammen.</Text>
        </View>
        <View className="mt-3">
          <Text variant="muted">
            Auch das Unternehmen hat Interesse an dir. Ihr könnt jetzt in
            Kontakt treten.
          </Text>
        </View>

        <View className="mt-12 rounded-3xl bg-white p-6">
          <Text variant="caption">Unternehmen</Text>
          <View className="mt-2">
            <Text variant="subheading">{company.display_name}</Text>
          </View>
          <View className="mt-5 h-px bg-brand-100" />
          <View className="mt-5">
            <Text variant="caption">Position</Text>
            <View className="mt-2">
              <Text variant="body">{match.job.title}</Text>
            </View>
          </View>
        </View>

        <View className="mt-auto gap-3 pb-6">
          <Button
            onPress={() => {}}
            disabled
            leadingIcon={
              <Ionicons name="chatbubble-outline" size={20} color={neutral.white} />
            }
          >
            Zum Chat (kommt bald)
          </Button>
          <Button
            variant="ghost"
            onPress={() => router.replace('/(app)/feed')}
            leadingIcon={
              <Ionicons name="arrow-back" size={20} color={brand[800]} />
            }
          >
            Weiter swipen
          </Button>
        </View>
      </View>
    </SafeAreaView>
  )
}
