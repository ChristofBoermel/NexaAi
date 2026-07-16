// Deep-link callback screen for password reset. User clicked the reset link
// in their email; Supabase redirected here with ?code=<pkce>. We exchange
// the code for a recovery session, then show the new-password form.

import { useEffect, useState } from 'react'
import { Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useLocalSearchParams, useRouter } from 'expo-router'

import { resetConfirmSchema, type ResetConfirmInput } from '@nexaai/types'

import { exchangeCodeForSession, updatePassword } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { FormScroll } from '@/components/ui/form-scroll'
import { Input } from '@/components/ui/input'
import { LogoMark } from '@/components/ui/logo-mark'
import { Text as UIText } from '@/components/ui/text'

type Phase = 'exchanging' | 'form' | 'invalid'

export default function ResetCallback() {
  const router = useRouter()
  const { code } = useLocalSearchParams<{ code?: string }>()
  const [phase, setPhase] = useState<Phase>('exchanging')
  const [submitError, setSubmitError] = useState<string | null>(null)
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetConfirmInput>({
    resolver: zodResolver(resetConfirmSchema),
    defaultValues: { password: '', passwordConfirm: '' },
  })

  useEffect(() => {
    if (!code) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPhase('invalid')
      return
    }
    exchangeCodeForSession(code).then(({ error }) => {
      setPhase(error ? 'invalid' : 'form')
    })
  }, [code])

  const onSubmit = async (data: ResetConfirmInput) => {
    setSubmitError(null)
    const { error } = await updatePassword(data.password)
    if (error) {
      setSubmitError(error.message)
      return
    }
    router.replace('/(app)')
  }

  if (phase === 'exchanging') {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 items-center justify-center">
          <LogoMark size="md" />
          <View className="mt-6">
            <UIText variant="muted">Reset-Link wird geprüft...</UIText>
          </View>
        </View>
      </SafeAreaView>
    )
  }

  if (phase === 'invalid') {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <FormScroll
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
              <UIText variant="heading">Link ungültig</UIText>
            </View>
            <View className="mt-2">
              <UIText variant="muted">
                Der Reset-Link ist abgelaufen oder wurde schon benutzt. Fordere einen neuen an.
              </UIText>
            </View>
            <View className="mt-auto">
              <Button onPress={() => router.replace('/(auth)/password-reset')}>
                Neuen Link anfordern
              </Button>
            </View>
          </View>
        </FormScroll>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <FormScroll
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 24,
          paddingVertical: 32,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1">
          <View className="items-center">
            <LogoMark size="md" />
          </View>
          <View className="mt-10">
            <UIText variant="heading">Neues Passwort</UIText>
          </View>
          <View className="mt-2">
            <UIText variant="muted">Wähle ein neues Passwort für dein Konto.</UIText>
          </View>

          <View className="mt-10 gap-4">
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Neues Passwort"
                  value={value}
                  onChangeText={onChange}
                  error={errors.password?.message}
                  secureTextEntry
                  placeholder="********"
                />
              )}
            />
            <Controller
              control={control}
              name="passwordConfirm"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Passwort bestätigen"
                  value={value}
                  onChangeText={onChange}
                  error={errors.passwordConfirm?.message}
                  secureTextEntry
                  placeholder="********"
                />
              )}
            />
          </View>

          {submitError && (
            <Text className="mt-4 text-center text-sm text-red-600">{submitError}</Text>
          )}

          <View className="mt-8">
            <Button onPress={handleSubmit(onSubmit)} loading={isSubmitting}>
              Passwort speichern
            </Button>
          </View>
        </View>
      </FormScroll>
    </SafeAreaView>
  )
}
