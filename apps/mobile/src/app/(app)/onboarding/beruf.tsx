// Onboarding Step 1: Berufsbezeichnung (Freitext).
// Ohne Titel geht es nicht weiter, das ist der Kopf im CV.

import { useEffect } from 'react'
import { ScrollView, Text, View } from 'react-native'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'expo-router'
import { z } from 'zod'

import { useSession } from '@/lib/auth'
import { saveJobTitle, useSeekerProfile } from '@/lib/seeker'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Text as UIText } from '@/components/ui/text'

const schema = z.object({
  jobTitle: z
    .string()
    .min(2, 'Bitte gib deine Berufsbezeichnung ein')
    .max(80, 'Die Berufsbezeichnung ist zu lang'),
})

type Form = z.infer<typeof schema>

export default function Beruf() {
  const router = useRouter()
  const { session } = useSession()
  const userId = session?.user.id
  const { seeker, isLoading } = useSeekerProfile()

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { jobTitle: '' },
  })

  useEffect(() => {
    if (seeker?.job_title) {
      reset({ jobTitle: seeker.job_title })
    }
  }, [seeker, reset])

  const onSubmit = async ({ jobTitle }: Form) => {
    if (!userId) return
    const { error } = await saveJobTitle(userId, jobTitle.trim())
    if (error) return
    router.push('/(app)/onboarding/basics')
  }

  if (isLoading) {
    return <View className="flex-1 bg-white" />
  }

  return (
    <ScrollView
      className="flex-1 bg-white"
      contentContainerStyle={{
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingVertical: 24,
      }}
      keyboardShouldPersistTaps="handled"
    >
      <View className="flex-1">
        <UIText variant="heading">Was ist dein Beruf?</UIText>
        <View className="mt-2">
          <UIText variant="muted">
            Genau diese Bezeichnung erscheint spaeter oben in deinem Lebenslauf.
          </UIText>
        </View>

        <View className="mt-8">
          <Controller
            control={control}
            name="jobTitle"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Berufsbezeichnung"
                value={value}
                onChangeText={onChange}
                error={errors.jobTitle?.message}
                placeholder="z.B. Anlagenmechaniker SHK"
              />
            )}
          />
        </View>

        <View className="mt-auto pt-8">
          <Button onPress={handleSubmit(onSubmit)} disabled={isSubmitting}>
            Weiter
          </Button>
        </View>
      </View>
    </ScrollView>
  )
}
