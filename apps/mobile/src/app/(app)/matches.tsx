// Mutual match list. Opens the seeker chat for each revealed company.

import { FlatList, Pressable, Text as RNText, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

import { useSession } from '@/lib/auth'
import { brand } from '@/lib/colors'
import { useMatches, type MutualMatchRow } from '@/lib/chat'
import { Button } from '@/components/ui/button'
import { LogoMark } from '@/components/ui/logo-mark'
import { Skeleton } from '@/components/ui/skeleton'
import { Text } from '@/components/ui/text'

function MatchListItem({
  match,
  userId,
  onPress,
}: {
  match: MutualMatchRow
  userId: string | undefined
  onPress: () => void
}) {
  const latestMessage = match.messages?.[0]
  const hasUnread =
    latestMessage != null &&
    latestMessage.read_at == null &&
    latestMessage.sender_id !== userId

  return (
    <Pressable onPress={onPress} className="rounded-3xl bg-white p-5">
      <View className="flex-row items-start justify-between gap-4">
        <View className="flex-1">
          <Text variant="caption">{match.job.company.display_name}</Text>
          <View className="mt-2">
            <Text variant="subheading">{match.job.title}</Text>
          </View>
          {latestMessage ? (
            <View className="mt-3">
              <RNText numberOfLines={1} className="text-sm text-brand-500">
                {latestMessage.body}
              </RNText>
            </View>
          ) : (
            <View className="mt-3">
              <Text variant="muted">Noch keine Nachrichten</Text>
            </View>
          )}
        </View>
        <View className="items-end gap-3">
          {hasUnread ? <View className="h-3 w-3 rounded-full bg-brand-800" /> : null}
          <Ionicons name="chevron-forward" size={20} color={brand[400]} />
        </View>
      </View>
    </Pressable>
  )
}

export default function MatchesScreen() {
  const router = useRouter()
  const { session } = useSession()
  const { items, isLoading } = useMatches('mutual')

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-cream-50">
        <View className="flex-1 px-8 py-8 gap-4">
          <Skeleton width={140} height={16} />
          <Skeleton width="80%" height={54} />
          <Skeleton width="100%" height={96} />
          <Skeleton width="100%" height={96} />
        </View>
      </SafeAreaView>
    )
  }

  if (items.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-cream-50">
        <View className="flex-1 justify-center px-8">
          <LogoMark size="sm" />
          <View className="mt-8">
            <Text variant="caption">Deine Matches</Text>
          </View>
          <View className="mt-3">
            <Text variant="display">Noch wartet niemand.</Text>
          </View>
          <View className="mt-3">
            <Text variant="muted">
              Öffne den Feed und zeig Interesse an passenden Stellen.
            </Text>
          </View>
          <View className="mt-10">
            <Button onPress={() => router.replace('/(app)/feed')}>
              Zum Job-Feed
            </Button>
          </View>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-cream-50">
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: 24,
          paddingBottom: 40,
          gap: 14,
        }}
        ListHeaderComponent={
          <View className="mb-5">
            <LogoMark size="sm" />
            <View className="mt-8">
              <Text variant="caption">Deine Matches</Text>
            </View>
            <View className="mt-3">
              <Text variant="display">Wer will mit dir sprechen</Text>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <MatchListItem
            match={item}
            userId={session?.user.id}
            onPress={() => router.push(`/(app)/chat/${item.id}`)}
          />
        )}
      />
    </SafeAreaView>
  )
}
