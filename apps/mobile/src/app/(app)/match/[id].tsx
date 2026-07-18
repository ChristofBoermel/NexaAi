// Match notification screen. Reveals the company display name (unblur) and
// gives the seeker two choices: open chat (disabled until the chat chunk
// lands) or keep swiping.

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
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 items-center justify-center gap-4 px-6">
          <Skeleton width={180} height={54} />
          <Skeleton width="80%" height={24} />
          <Skeleton width="60%" height={18} />
        </View>
      </SafeAreaView>
    )
  }

  if (!match) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 items-center justify-center px-6">
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
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 items-center px-6 pt-12">
        <LogoMark size="md" />

        <View className="mt-10 items-center">
          <Ionicons name="sparkles" size={40} color={brand[800]} />
        </View>
        <View className="mt-4 items-center">
          <Text variant="heading">Neues Match!</Text>
        </View>
        <View className="mt-2 items-center px-4">
          <Text variant="muted">
            Auch das Unternehmen hat Interesse an dir. Ihr könnt jetzt in Kontakt treten.
          </Text>
        </View>

        <View className="mt-10 w-full rounded-2xl border border-brand-100 bg-brand-50 p-6">
          <Text variant="muted">Unternehmen</Text>
          <View className="mt-1">
            <Text variant="subheading">{company.display_name}</Text>
          </View>
          <View className="mt-4 h-px bg-brand-200" />
          <View className="mt-4">
            <Text variant="muted">Position</Text>
            <View className="mt-1">
              <Text variant="body">{match.job.title}</Text>
            </View>
          </View>
        </View>

        <View className="mt-auto w-full gap-3 pb-6">
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
