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
import { Text as UIText } from '@/components/ui/text'
import { LogoMark } from '@/components/ui/logo-mark'

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
              <UIText variant="heading">
                E-Mail bestaetigen
              </UIText>
            </View>
            <View className="mt-2">
              <UIText variant="muted">
                Wir haben dir einen Bestaetigungslink gesendet. Klick den Link in der
                E-Mail um dein Konto zu aktivieren.
              </UIText>
            </View>
            <View className="mt-auto">
              <Button onPress={() => router.replace('/(auth)/login')}>
                Zurueck zum Login
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
            <UIText variant="heading">
              Konto erstellen
            </UIText>
          </View>
          <View className="mt-2">
            <UIText variant="muted">
              Erstell dir dein NexaAi-Profil in wenigen Schritten.
            </UIText>
          </View>

          <View className="mt-10 gap-4">
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
                  placeholder="********"
                />
              )}
            />
            <Controller
              control={control}
              name="passwordConfirm"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Passwort bestaetigen"
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
            <Text className="mt-4 text-center text-sm text-red-600">
              {submitError}
            </Text>
          )}

          <View className="mt-8">
            <Button onPress={handleSubmit(onSubmit)} disabled={isSubmitting}>
              Registrieren
            </Button>
          </View>

          <View className="mt-auto">
            <View className="flex-row justify-center">
              <Text className="text-brand-900">Schon einen Account? </Text>
              <Link
                href="/(auth)/login"
                className="font-bold text-brand-800"
              >
                Anmelden
              </Link>
            </View>
            <Text className="mt-6 text-center text-xs text-brand-500">
              Mit der Registrierung akzeptierst du die Nutzungsbedingungen und
              Datenschutzerklaerung.
            </Text>
          </View>
        </View>
      </FormScroll>
    </SafeAreaView>
  )
}
