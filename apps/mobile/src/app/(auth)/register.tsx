import { useState } from 'react'
import { Text, View } from 'react-native'

import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useRouter } from 'expo-router'

import { registerSchema, type RegisterInput } from '@nexaai/types'

import { signUpWithPassword } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Text as UIText } from '@/components/ui/text'

export default function Register() {
  const router = useRouter()
  const [confirmSent, setConfirmSent] = useState(false)
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: '', password: '', passwordConfirm: '' },
  })

  const onSubmit = async (data: RegisterInput) => {
    const { error } = await signUpWithPassword(data.email, data.password)
    if (!error) setConfirmSent(true)
  }

  if (confirmSent) {
    return (
      <View className="flex-1 bg-white px-6 pt-16">
        <UIText variant="heading">E-Mail bestaetigen</UIText>
        <Text className="mt-2 text-sm text-neutral-500">
          Wir haben dir einen Bestaetigungslink gesendet. Klick den Link in der E-Mail
          um dein Konto zu aktivieren.
        </Text>
        <View className="mt-8">
          <Button onPress={() => router.replace('/(auth)/login')}>
            Zurueck zum Login
          </Button>
        </View>
      </View>
    )
  }

  return (
    <View className="flex-1 bg-white px-6 pt-16">
      <UIText variant="heading">Konto erstellen</UIText>
      <UIText variant="muted">Erstell dir dein NexaAi-Profil.</UIText>

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

      <Button onPress={handleSubmit(onSubmit)} disabled={isSubmitting}>
        Registrieren
      </Button>

      <View className="mt-6 flex-row justify-center gap-1">
        <Text>Schon einen Account?</Text>
        <Link href="/(auth)/login" className="text-neutral-900 font-semibold">
          Anmelden
        </Link>
      </View>
    </View>
  )
}
