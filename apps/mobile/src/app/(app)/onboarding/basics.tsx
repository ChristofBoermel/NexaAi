// Onboarding Step 2: Basis-Daten für den CV-Header.
// Vorname, Nachname, Geburtsjahr (opt), PLZ + Stadt, Führerschein, PKW,
// Verfügbar-Datum, Gehaltsvorstellung (opt).

import { useEffect } from 'react'
import { Text, View } from 'react-native'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

import { basicsSchema, type BasicsInput } from '@nexaai/types'

import { useSession } from '@/lib/auth'
import { brand } from '@/lib/colors'
import { getParsedCvDraft } from '@/lib/cv-upload'
import { lookupCity } from '@/lib/plz'
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
    setValue,
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
    const draft = getParsedCvDraft()
    const basics = draft?.basics

    reset({
      firstName: profile?.first_name ?? basics?.firstName ?? '',
      lastName: profile?.last_name ?? basics?.lastName ?? '',
      jobTitle: seeker?.job_title ?? basics?.jobTitle ?? '',
      birthYear: seeker?.birth_year ?? basics?.birthYear ?? undefined,
      postalCode: seeker?.postal_code ?? basics?.postalCode ?? '',
      city: seeker?.city ?? basics?.city ?? '',
      hasDriverLicense: seeker?.has_driver_license ?? basics?.hasDriverLicense ?? false,
      hasCar: seeker?.has_car ?? basics?.hasCar ?? false,
      availableFrom: seeker?.available_from ?? basics?.availableFrom ?? '',
      salaryExpectation:
        seeker?.salary_expectation_eur ?? basics?.salaryExpectation ?? undefined,
    })
  }, [profile, seeker, reset])

  // Autofill Stadt sobald die PLZ 5 Ziffern hat. Nur wenn die Stadt noch leer
  // ist, damit wir keine manuelle Eingabe ueberschreiben.
  const postalCode = useWatch({ control, name: 'postalCode' })
  const city = useWatch({ control, name: 'city' })
  useEffect(() => {
    if (!/^\d{5}$/.test(postalCode ?? '')) return
    if (city && city.length > 0) return
    let cancelled = false
    lookupCity(postalCode).then((match) => {
      if (cancelled || !match) return
      setValue('city', match, { shouldDirty: true })
    })
    return () => {
      cancelled = true
    }
  }, [postalCode, city, setValue])

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
      <UIText variant="heading">Über dich</UIText>
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
            <Switch label="Führerschein" value={value} onValueChange={onChange} />
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
              label="Verfügbar ab"
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
              label="Gehaltsvorstellung EUR pro Monat (optional)"
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

      <View className="mt-6 flex-row items-start gap-2 rounded-xl bg-brand-50 px-4 py-3">
        <Ionicons name="lock-closed-outline" size={16} color={brand[500]} />
        <Text className="flex-1 text-xs leading-5 text-brand-500">
          Dein Nachname und deine Gehaltsvorstellung bleiben privat. Ein Recruiter sieht sie erst, wenn ihr beide Interesse gezeigt habt.
        </Text>
      </View>

      <View className="mt-6">
        <Button onPress={handleSubmit(onSubmit)} loading={isSubmitting}>
          Weiter
        </Button>
      </View>
    </FormScroll>
  )
}
