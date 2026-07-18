// Loading screen after the seeker approves their CV. Runs the matchmaking
// function server-side and then routes into the feed. Always waits at least
// 1.5s so the transition feels intentional and gives users a beat to breathe.

import { useEffect } from 'react'
import { View } from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'

import { runMatchmaking } from '@/lib/jobs'
import { LogoMark } from '@/components/ui/logo-mark'
import { Skeleton } from '@/components/ui/skeleton'
import { Text } from '@/components/ui/text'

export default function Search() {
  const router = useRouter()

  useEffect(() => {
    let cancelled = false
    const startedAt = Date.now()

    async function run() {
      await runMatchmaking()
      const elapsed = Date.now() - startedAt
      const minWait = 1500
      if (elapsed < minWait) {
        await new Promise((r) => setTimeout(r, minWait - elapsed))
      }
      if (cancelled) return
      router.replace('/(app)/feed')
    }

    run()

    return () => {
      cancelled = true
    }
  }, [router])

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center px-6">
        <LogoMark size="md" />
        <View className="mt-8">
          <Text variant="heading">Wir suchen passende Arbeitgeber</Text>
        </View>
        <View className="mt-2 items-center">
          <Text variant="muted">Das dauert nur einen Moment.</Text>
        </View>
        <View className="mt-10 w-full gap-3">
          <Skeleton width="100%" height={20} />
          <Skeleton width="80%" height={20} />
          <Skeleton width="90%" height={20} />
        </View>
      </View>
    </SafeAreaView>
  )
}
