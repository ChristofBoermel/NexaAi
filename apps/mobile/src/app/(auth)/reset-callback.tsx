// Deep-link callback screen: user landed here after clicking the reset link
// in their email. At this point Supabase (via the URL handler set up in
// Chunk C) has established a recovery session for us. We collect the new
// password and call updateUser.

import { useState } from 'react'
import { ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'expo-router'

import { resetConfirmSchema, type ResetConfirmInput } from '@nexaai/types'

import { updatePassword } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LogoMark } from '@/components/ui/logo-mark'
import { Text as UIText } from '@/components/ui/text'

export default function ResetCallback() {
  const router = useRouter()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetConfirmInput>({
    resolver: zodResolver(resetConfirmSchema),
    defaultValues: { password: '', passwordConfirm: '' },
  })

  const onSubmit = async (data: ResetConfirmInput) => {
    setSubmitError(null)
    const { error } = await updatePassword(data.password)
    if (error) {
      setSubmitError(error.message)
      return
    }
    router.replace('/(app)')
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
            <UIText variant="heading">Neues Passwort</UIText>
          </View>
          <View className="mt-2">
            <UIText variant="muted">Waehle ein neues Passwort fuer dein Konto.</UIText>
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
            <Text className="mt-4 text-center text-sm text-red-600">{submitError}</Text>
          )}

          <View className="mt-8">
            <Button onPress={handleSubmit(onSubmit)} disabled={isSubmitting}>
              Passwort speichern
            </Button>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
