import { useState } from 'react'
import { Text, View } from 'react-native'

import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'expo-router'

import { loginSchema, type LoginInput } from '@nexaai/types'

import { signInWithPassword } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
    <View className="flex-1 bg-white px-6 pt-16">
      <UIText variant="heading">Anmelden</UIText>
      <UIText variant="muted">Schoen dich zu sehen.</UIText>

      <View className="mt-8 gap-4">
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

      {submitError && (
        <Text className="mt-4 text-center text-sm text-red-600">
          E-Mail oder Passwort ist falsch
        </Text>
      )}

      <Button onPress={handleSubmit(onSubmit)} disabled={isSubmitting}>
        Einloggen
      </Button>

      <View className="mt-6 flex-row justify-center gap-1">
        <Text>Noch keinen Account?</Text>
        <Link href="/(auth)/register" className="text-neutral-900 font-semibold">
          Registrieren
        </Link>
      </View>
    </View>
  )
}
