// Password reset request screen.
// User gibt Email ein, Supabase schickt Reset-Link, wir zeigen Confirmation.

import { useState } from 'react'
import { Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useRouter } from 'expo-router'

import { resetRequestSchema, type ResetRequestInput } from '@nexaai/types'

import { requestPasswordReset } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { FormScroll } from '@/components/ui/form-scroll'
import { Input } from '@/components/ui/input'
import { LogoMark } from '@/components/ui/logo-mark'
import { Text as UIText } from '@/components/ui/text'

export default function PasswordReset() {
  const router = useRouter()
  const [sent, setSent] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetRequestInput>({
    resolver: zodResolver(resetRequestSchema),
    defaultValues: { email: '' },
  })

  const onSubmit = async (data: ResetRequestInput) => {
    setSubmitError(null)
    const { error } = await requestPasswordReset(data.email)
    if (error) {
      setSubmitError(error.message)
      return
    }
    setSent(true)
  }

  if (sent) {
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
              <UIText variant="heading">E-Mail gesendet</UIText>
            </View>
            <View className="mt-2">
              <UIText variant="muted">
                Wenn ein Konto zu dieser E-Mail existiert, haben wir dir einen Reset-Link geschickt.
              </UIText>
            </View>
            <View className="mt-auto">
              <Button onPress={() => router.replace('/(auth)/login')}>
                Zurück zum Login
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
            <UIText variant="heading">Passwort vergessen</UIText>
          </View>
          <View className="mt-2">
            <UIText variant="muted">
              Gib deine E-Mail ein, wir schicken dir einen Link zum Zurücksetzen.
            </UIText>
          </View>

          <View className="mt-10">
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="E-Mail"
                  value={value}
                  onChangeText={onChange}
                  error={errors.email?.message}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  placeholder="deine@email.de"
                />
              )}
            />
          </View>

          {submitError && (
            <Text className="mt-4 text-center text-sm text-red-600">{submitError}</Text>
          )}

          <View className="mt-8">
            <Button onPress={handleSubmit(onSubmit)} loading={isSubmitting}>
              Link senden
            </Button>
          </View>

          <View className="mt-auto">
            <View className="flex-row justify-center">
              <Text className="text-brand-900">Zurück zum </Text>
              <Link href="/(auth)/login" className="font-bold text-brand-800">
                Login
              </Link>
            </View>
          </View>
        </View>
      </FormScroll>
    </SafeAreaView>
  )
}
