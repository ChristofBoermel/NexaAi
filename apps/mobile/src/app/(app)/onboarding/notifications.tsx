// Optional notification opt-in after CV approval.

import { useState } from 'react'
import { Text as RNText, View } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

import { useSession } from '@/lib/auth'
import { brand, neutral } from '@/lib/colors'
import { registerPushToken } from '@/lib/push'
import { Button } from '@/components/ui/button'
import { Text } from '@/components/ui/text'

export default function NotificationsStep() {
  const router = useRouter()
  const { session } = useSession()
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setSubmitting] = useState(false)

  const continueToApp = () => {
    router.replace('/(app)')
  }

  const onAllow = async () => {
    if (!session?.user.id) return
    setSubmitting(true)
    setError(null)
    const { error: pushError } = await registerPushToken(session.user.id)
    setSubmitting(false)

    if (pushError) {
      setError(pushError)
      return
    }

    continueToApp()
  }

  return (
    <View className="flex-1 bg-white px-6 py-8">
      <View className="h-14 w-14 items-center justify-center rounded-full bg-brand-50">
        <Ionicons name="notifications-outline" size={28} color={brand[800]} />
      </View>

      <View className="mt-8">
        <Text variant="heading">Benachrichtigungen</Text>
        <View className="mt-3">
          <Text variant="muted">
            Wir melden uns nur bei neuen Matches und Chat-Nachrichten. Du kannst auch ohne Benachrichtigungen weitermachen.
          </Text>
        </View>
      </View>

      {error ? (
        <View className="mt-6 rounded-lg bg-red-50 px-4 py-3">
          <RNText className="text-sm text-red-700">{error}</RNText>
        </View>
      ) : null}

      <View className="mt-auto gap-3">
        <Button
          onPress={onAllow}
          loading={isSubmitting}
          leadingIcon={<Ionicons name="checkmark-outline" size={20} color={neutral.white} />}
        >
          Benachrichtigungen erlauben
        </Button>
        <Button variant="ghost" onPress={continueToApp}>
          Jetzt nicht
        </Button>
      </View>
    </View>
  )
}
