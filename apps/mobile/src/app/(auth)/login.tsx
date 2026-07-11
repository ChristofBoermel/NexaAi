import { useState } from 'react'
import { ScrollView, Text, View } from 'react-native'

import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'

import { loginSchema, type LoginInput } from '@nexaai/types'

import { signInWithPassword } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Text as UIText } from '@/components/ui/text'
import { LogoMark } from '@/components/ui/logo-mark'

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
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView
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
              Anmelden
            </UIText>
          </View>
          <View className="mt-2">
            <UIText variant="muted">
              Melde dich mit deiner E-Mail an.
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
            <Text className="mt-4 text-center text-sm text-red-600">
              E-Mail oder Passwort ist falsch
            </Text>
          )}

          <View className="mt-8">
            <Button onPress={handleSubmit(onSubmit)} disabled={isSubmitting}>
              Einloggen
            </Button>
          </View>

          <View className="mt-auto">
            <View className="flex-row justify-center">
              <Text className="text-brand-900">Noch keinen Account? </Text>
              <Link
                href="/(auth)/register"
                className="font-bold text-brand-800"
              >
                Registrieren
              </Link>
            </View>
            <Text className="mt-6 text-center text-xs text-brand-500">
              Mit dem Login akzeptierst du die Nutzungsbedingungen und
              Datenschutzerklaerung.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
