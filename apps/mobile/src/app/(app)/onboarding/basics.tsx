// Onboarding Step 2: Basis-Daten fuer den CV-Header.
// Vorname, Nachname, Geburtsjahr (opt), PLZ + Stadt, Fuehrerschein, PKW,
// Verfuegbar-Datum, Gehaltsvorstellung (opt).

import { useEffect } from 'react'
import { View } from 'react-native'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'expo-router'

import { basicsSchema, type BasicsInput } from '@nexaai/types'

import { useSession } from '@/lib/auth'
import { saveBasics, useSeekerProfile } from '@/lib/seeker'
import { Button } from '@/components/ui/button'
import { FormScroll } from '@/components/ui/form-scroll'
import { DatePicker } from '@/components/ui/date-picker'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Text as UIText } from '@/components/ui/text'

export default function Basics() {
  const router = useRouter()
  const { session } = useSession()
  const userId = session?.user.id
  const { profile, seeker, isLoading } = useSeekerProfile()

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BasicsInput>({
    resolver: zodResolver(basicsSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      jobTitle: '',
      postalCode: '',
      city: '',
      hasDriverLicense: false,
      hasCar: false,
      availableFrom: '',
    },
  })

  useEffect(() => {
    reset({
      firstName: profile?.first_name ?? '',
      lastName: profile?.last_name ?? '',
      jobTitle: seeker?.job_title ?? '',
      birthYear: seeker?.birth_year ?? undefined,
      postalCode: seeker?.postal_code ?? '',
      city: seeker?.city ?? '',
      hasDriverLicense: seeker?.has_driver_license ?? false,
      hasCar: seeker?.has_car ?? false,
      availableFrom: seeker?.available_from ?? '',
      salaryExpectation: seeker?.salary_expectation_eur ?? undefined,
    })
  }, [profile, seeker, reset])

  const onSubmit = async (data: BasicsInput) => {
    if (!userId) return
    const { error } = await saveBasics(userId, data)
    if (error) return
    router.push('/(app)/onboarding/erfahrung')
  }

  if (isLoading) {
    return <View className="flex-1 bg-white" />
  }

  return (
    <FormScroll
      className="flex-1 bg-white"
      contentContainerStyle={{
        paddingHorizontal: 24,
        paddingVertical: 24,
        paddingBottom: 48,
      }}
      keyboardShouldPersistTaps="handled"
    >
      <UIText variant="heading">Ueber dich</UIText>
      <View className="mt-2">
        <UIText variant="muted">
          Diese Daten stehen im Kopf deines Lebenslaufs. Nachname sieht der Recruiter erst nach dem Match.
        </UIText>
      </View>

      <View className="mt-8 gap-4">
        <Controller
          control={control}
          name="firstName"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Vorname"
              value={value}
              onChangeText={onChange}
              error={errors.firstName?.message}
              autoCapitalize="sentences"
            />
          )}
        />
        <Controller
          control={control}
          name="lastName"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Nachname"
              value={value}
              onChangeText={onChange}
              error={errors.lastName?.message}
              autoCapitalize="sentences"
            />
          )}
        />
        <Controller
          control={control}
          name="birthYear"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Geburtsjahr (optional)"
              value={value != null ? String(value) : ''}
              onChangeText={(t) => {
                const n = parseInt(t, 10)
                onChange(Number.isFinite(n) ? n : undefined)
              }}
              error={errors.birthYear?.message}
              keyboardType="default"
              placeholder="z.B. 1985"
            />
          )}
        />
        <Controller
          control={control}
          name="postalCode"
          render={({ field: { onChange, value } }) => (
            <Input
              label="PLZ"
              value={value}
              onChangeText={onChange}
              error={errors.postalCode?.message}
              keyboardType="default"
              placeholder="22417"
            />
          )}
        />
        <Controller
          control={control}
          name="city"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Stadt"
              value={value}
              onChangeText={onChange}
              error={errors.city?.message}
              autoCapitalize="sentences"
              placeholder="Hamburg"
            />
          )}
        />
        <Controller
          control={control}
          name="hasDriverLicense"
          render={({ field: { onChange, value } }) => (
            <Switch label="Fuehrerschein" value={value} onValueChange={onChange} />
          )}
        />
        <Controller
          control={control}
          name="hasCar"
          render={({ field: { onChange, value } }) => (
            <Switch label="Eigenes Auto (PKW)" value={value} onValueChange={onChange} />
          )}
        />
        <Controller
          control={control}
          name="availableFrom"
          render={({ field: { onChange, value } }) => (
            <DatePicker
              label="Verfuegbar ab"
              value={value ?? null}
              onChangeIso={onChange}
              error={errors.availableFrom?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="salaryExpectation"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Gehaltsvorstellung in EUR pro Monat (optional)"
              value={value != null ? String(value) : ''}
              onChangeText={(t) => {
                const n = parseInt(t, 10)
                onChange(Number.isFinite(n) ? n : undefined)
              }}
              error={errors.salaryExpectation?.message}
              keyboardType="default"
              placeholder="3600"
            />
          )}
        />
      </View>

      <View className="mt-8">
        <Button onPress={handleSubmit(onSubmit)} disabled={isSubmitting}>
          Weiter
        </Button>
      </View>
    </FormScroll>
  )
}
