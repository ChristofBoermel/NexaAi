// Deep-link callback screen for email confirmation. User clicked the confirm
// link in their signup email; Supabase redirected here with either
// ?code=<pkce> (modern) or ?token_hash=<hash>&type=signup (legacy).

import { useEffect, useState } from 'react'
import { View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'

import { exchangeCodeForSession, verifySignupToken } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { LogoMark } from '@/components/ui/logo-mark'
import { Text as UIText } from '@/components/ui/text'

type Phase = 'verifying' | 'success' | 'invalid'

export default function ConfirmCallback() {
  const router = useRouter()
  const { code, token_hash } = useLocalSearchParams<{ code?: string; token_hash?: string }>()
  const [phase, setPhase] = useState<Phase>('verifying')

  useEffect(() => {
    async function run() {
      if (code) {
        const { error } = await exchangeCodeForSession(code)
        setPhase(error ? 'invalid' : 'success')
        return
      }
      if (token_hash) {
        const { error } = await verifySignupToken(token_hash)
        setPhase(error ? 'invalid' : 'success')
        return
      }
      setPhase('invalid')
    }
    run()
  }, [code, token_hash])

  useEffect(() => {
    if (phase !== 'success') return
    const t = setTimeout(() => router.replace('/(app)'), 800)
    return () => clearTimeout(t)
  }, [phase, router])

  if (phase === 'verifying') {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 items-center justify-center">
          <LogoMark size="md" />
          <View className="mt-6">
            <UIText variant="muted">E-Mail wird bestaetigt...</UIText>
          </View>
        </View>
      </SafeAreaView>
    )
  }

  if (phase === 'success') {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 items-center justify-center px-6">
          <LogoMark size="md" />
          <View className="mt-6">
            <UIText variant="heading">Willkommen</UIText>
          </View>
          <View className="mt-2">
            <UIText variant="muted">Wir bringen dich in die App.</UIText>
          </View>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center px-6">
        <LogoMark size="md" />
        <View className="mt-6">
          <UIText variant="heading">Link ungueltig</UIText>
        </View>
        <View className="mt-2">
          <UIText variant="muted">
            Der Bestaetigungslink ist abgelaufen oder wurde schon benutzt.
          </UIText>
        </View>
        <View className="mt-8 w-full">
          <Button onPress={() => router.replace('/(auth)/login')}>
            Zurueck zum Login
          </Button>
        </View>
      </View>
    </SafeAreaView>
  )
}
