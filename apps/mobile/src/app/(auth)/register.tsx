// Editorial hero register screen. Same rhythm as Login for full multi-screen
// consistency. Confirm-sent state keeps the same visual system: LogoMark
// small at top-left, caption eyebrow, display heading, muted body, CTA.

import { useState } from 'react'
import { Text, View } from 'react-native'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'

import { registerSchema, type RegisterInput } from '@nexaai/types'

import { signUpWithPassword } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { FormScroll } from '@/components/ui/form-scroll'
import { Input } from '@/components/ui/input'
import { LogoMark } from '@/components/ui/logo-mark'
import { Text as UIText } from '@/components/ui/text'

export default function Register() {
  const router = useRouter()
  const [confirmSent, setConfirmSent] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: '', password: '', passwordConfirm: '' },
  })

  const onSubmit = async (data: RegisterInput) => {
    setSubmitError(null)
    const { data: authData, error } = await signUpWithPassword(data.email, data.password)
    if (error) {
      setSubmitError(error.message)
      return
    }
    if (authData.session) {
      // Supabase gab uns direkt eine Session (email-confirm ist im Projekt aus).
      // Der SessionProvider hebt sie hoch und (auth)/_layout redirected zu /(app).
      return
    }
    setConfirmSent(true)
  }

  if (confirmSent) {
    return (
      <SafeAreaView className="flex-1 bg-cream-50">
        <FormScroll
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 28,
            paddingTop: 24,
            paddingBottom: 32,
          }}
        >
          <View className="flex-1">
            <View className="items-start">
              <LogoMark size="sm" />
            </View>
            <View className="mt-14">
              <UIText variant="caption">Fast fertig</UIText>
            </View>
            <View className="mt-3">
              <UIText variant="display">Check dein Postfach.</UIText>
            </View>
            <View className="mt-3">
              <UIText variant="muted">
                Wir haben dir einen Bestätigungslink gesendet. Klick ihn, um dein
                Konto zu aktivieren.
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
    <SafeAreaView className="flex-1 bg-cream-50">
      <FormScroll
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 28,
          paddingTop: 24,
          paddingBottom: 32,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1">
          <View className="items-start">
            <LogoMark size="sm" />
          </View>

          <View className="mt-14">
            <UIText variant="caption">In 60 Sekunden</UIText>
          </View>
          <View className="mt-3">
            <UIText variant="display">Konto erstellen.</UIText>
          </View>
          <View className="mt-3">
            <UIText variant="muted">
              Danach führen wir dich durch das kurze Onboarding.
            </UIText>
          </View>

          <View className="mt-12 gap-5">
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
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Passwort"
                  value={value}
                  onChangeText={onChange}
                  error={errors.password?.message}
                  secureTextEntry
                  placeholder="mindestens 8 Zeichen"
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
                  placeholder="nochmal eingeben"
                />
              )}
            />
          </View>

          {submitError && (
            <Text className="mt-6 text-center text-sm text-red-600">
              {submitError}
            </Text>
          )}

          <View className="mt-10">
            <Button onPress={handleSubmit(onSubmit)} loading={isSubmitting}>
              Registrieren
            </Button>
          </View>

          <View className="mt-auto items-center pt-10">
            <View className="flex-row items-center">
              <Text className="text-brand-900">Schon einen Account? </Text>
              <Link
                href="/(auth)/login"
                className="font-bold text-brand-800"
              >
                Anmelden
              </Link>
            </View>
            <Text className="mt-6 text-center text-xs leading-5 text-brand-500">
              Mit der Registrierung akzeptierst du die Nutzungsbedingungen und die
              Datenschutzerklärung.
            </Text>
          </View>
        </View>
      </FormScroll>
    </SafeAreaView>
  )
}
