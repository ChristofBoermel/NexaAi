// Editorial hero login screen. Warm cream backdrop, generous whitespace,
// display-scale headline, subtle caption eyebrow. Follows the imagegen-mobile
// skill's rules: content-first, non-generic palette, breathing room, no
// decorative pill spam.

import { useState } from 'react'
import { Text, View } from 'react-native'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'

import { loginSchema, type LoginInput } from '@nexaai/types'

import { signInWithPassword } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { FormScroll } from '@/components/ui/form-scroll'
import { Input } from '@/components/ui/input'
import { LogoMark } from '@/components/ui/logo-mark'
import { Text as UIText } from '@/components/ui/text'

export default function Login() {
  const [submitError, setSubmitError] = useState(false)
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = async (data: LoginInput) => {
    setSubmitError(false)
    const { error } = await signInWithPassword(data.email, data.password)
    if (error) setSubmitError(true)
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
            <UIText variant="caption">Willkommen zurück</UIText>
          </View>
          <View className="mt-3">
            <UIText variant="display">Melde dich an.</UIText>
          </View>
          <View className="mt-3">
            <UIText variant="muted">Wir zeigen dir, wer gerade sucht.</UIText>
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
          </View>

          <View className="mt-3 items-end">
            <Link
              href="/(auth)/password-reset"
              className="text-sm text-brand-500"
            >
              Passwort vergessen?
            </Link>
          </View>

          {submitError && (
            <Text className="mt-6 text-center text-sm text-red-600">
              E-Mail oder Passwort ist falsch
            </Text>
          )}

          <View className="mt-10">
            <Button onPress={handleSubmit(onSubmit)} loading={isSubmitting}>
              Einloggen
            </Button>
          </View>

          <View className="mt-auto items-center pt-10">
            <View className="flex-row items-center">
              <Text className="text-brand-900">Noch keinen Account? </Text>
              <Link
                href="/(auth)/register"
                className="font-bold text-brand-800"
              >
                Registrieren
              </Link>
            </View>
            <Text className="mt-6 text-center text-xs leading-5 text-brand-500">
              Mit dem Login akzeptierst du die Nutzungsbedingungen und die
              Datenschutzerklärung.
            </Text>
          </View>
        </View>
      </FormScroll>
    </SafeAreaView>
  )
}
