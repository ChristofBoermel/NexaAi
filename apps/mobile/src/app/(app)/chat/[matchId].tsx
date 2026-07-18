// Seeker chat screen for a mutual match.

import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text as RNText,
  TextInput,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

import { useSession } from '@/lib/auth'
import { markRead, sendMessage, useMessages, type MessageRow } from '@/lib/chat'
import { brand, neutral } from '@/lib/colors'
import { useMatchDetail } from '@/lib/jobs'
import { LogoMark } from '@/components/ui/logo-mark'
import { Skeleton } from '@/components/ui/skeleton'
import { Text } from '@/components/ui/text'

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function MessageBubble({
  message,
  isOwn,
}: {
  message: MessageRow
  isOwn: boolean
}) {
  return (
    <View className={`mb-4 ${isOwn ? 'items-end' : 'items-start'}`}>
      <View
        className={`max-w-[82%] rounded-3xl px-4 py-3 ${
          isOwn ? 'bg-brand-800' : 'bg-cream-100'
        }`}
      >
        <RNText
          className={
            isOwn ? 'text-base leading-6 text-white' : 'text-base leading-6 text-brand-900'
          }
        >
          {message.body}
        </RNText>
      </View>
      <View className="mt-1 px-2">
        <Text variant="muted">{formatTime(message.created_at)}</Text>
      </View>
    </View>
  )
}

export default function ChatScreen() {
  const router = useRouter()
  const { matchId } = useLocalSearchParams<{ matchId: string }>()
  const { session } = useSession()
  const userId = session?.user.id
  const { match, isLoading: matchLoading } = useMatchDetail(matchId)
  const { items, isLoading: messagesLoading } = useMessages(matchId)
  const [body, setBody] = useState('')
  const [isSending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) return

    const unreadIds = items
      .filter((item) => item.read_at == null && item.sender_id !== userId)
      .map((item) => item.id)

    markRead(unreadIds)
  }, [items, userId])

  async function handleSend() {
    if (!matchId || isSending) return

    setSending(true)
    setError(null)
    const result = await sendMessage(matchId, body)
    setSending(false)

    if (result.error) {
      setError(result.error)
      return
    }

    setBody('')
  }

  if (matchLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 px-6 py-6 gap-4">
          <Skeleton width="70%" height={44} />
          <Skeleton width="80%" height={56} />
          <Skeleton width="65%" height={56} />
        </View>
      </SafeAreaView>
    )
  }

  if (!match) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 items-center justify-center px-8">
          <Text variant="heading">Chat nicht gefunden</Text>
          <View className="mt-6">
            <Pressable onPress={() => router.replace('/(app)/matches')}>
              <Text variant="body">Zurück zu deinen Matches</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    )
  }

  const messages = [...items].reverse()
  const canSend = body.trim().length > 0 && !isSending

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="border-b border-cream-200 bg-cream-50 px-6 py-4">
          <View className="flex-row items-center gap-3">
            <Pressable onPress={() => router.back()} className="p-1">
              <Ionicons name="arrow-back" size={22} color={brand[800]} />
            </Pressable>
            <LogoMark size="sm" />
            <View className="flex-1">
              <Text variant="subheading">{match.job.company.display_name}</Text>
              <Text variant="muted">{match.job.title}</Text>
            </View>
          </View>
        </View>

        {messagesLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color={brand[800]} />
          </View>
        ) : (
          <FlatList
            inverted
            data={messages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{
              paddingHorizontal: 20,
              paddingTop: 18,
              paddingBottom: 22,
            }}
            renderItem={({ item }) => (
              <MessageBubble message={item} isOwn={item.sender_id === userId} />
            )}
          />
        )}

        {error ? (
          <View className="border-t border-cream-200 px-5 py-2">
            <Text variant="muted">{error}</Text>
          </View>
        ) : null}

        <View className="border-t border-cream-200 bg-white px-5 py-4">
          <View className="flex-row items-end gap-3">
            <TextInput
              value={body}
              onChangeText={setBody}
              placeholder="Nachricht schreiben"
              placeholderTextColor={brand[400]}
              multiline
              className="max-h-32 flex-1 rounded-3xl bg-cream-100 px-4 py-3 text-base text-brand-900"
            />
            <Pressable
              onPress={handleSend}
              disabled={!canSend}
              className={`h-12 w-12 items-center justify-center rounded-full bg-brand-800 ${
                canSend ? '' : 'opacity-40'
              }`}
            >
              {isSending ? (
                <ActivityIndicator color={neutral.white} />
              ) : (
                <Ionicons name="send" size={20} color={neutral.white} />
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
