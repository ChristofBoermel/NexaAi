// Add/edit modal for a single education row.
// Same skeleton as experience-modal but with the education schema and a
// text field 'Status' instead of a subtitle.

import { useEffect, useState } from 'react'
import { Modal, Pressable, Text, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { educationSchema, type EducationInput } from '@nexaai/types'

import { Button } from '@/components/ui/button'
import { FormScroll } from '@/components/ui/form-scroll'
import { Input } from '@/components/ui/input'
import { MonthYearPicker } from '@/components/ui/month-year-picker'
import { Switch } from '@/components/ui/switch'
import { Text as UIText } from '@/components/ui/text'

export type EducationInitial = Partial<EducationInput> & { id?: string }

export function EducationModal({
  visible,
  initial,
  onDismiss,
  onSave,
}: {
  visible: boolean
  initial: EducationInitial | null
  onDismiss: () => void
  onSave: (data: EducationInput & { id?: string }) => Promise<void>
}) {
  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<EducationInput>({
    resolver: zodResolver(educationSchema),
    defaultValues: {
      title: '',
      startMonth: 1,
      startYear: new Date().getFullYear(),
      endMonth: null,
      endYear: null,
      status: '',
      description: '',
    },
  })

  const [isOngoing, setIsOngoing] = useState(false)

  useEffect(() => {
    if (!visible) return
    reset({
      title: initial?.title ?? '',
      startMonth: initial?.startMonth ?? 1,
      startYear: initial?.startYear ?? new Date().getFullYear(),
      endMonth: initial?.endMonth ?? null,
      endYear: initial?.endYear ?? null,
      status: initial?.status ?? '',
      description: initial?.description ?? '',
    })
    setIsOngoing(initial?.endMonth == null && initial?.endYear == null)
  }, [visible, initial, reset])

  const startMonth = watch('startMonth')
  const startYear = watch('startYear')
  const endMonth = watch('endMonth')
  const endYear = watch('endYear')

  const onSubmit = async (data: EducationInput) => {
    const payload = isOngoing ? { ...data, endMonth: null, endYear: null } : data
    await onSave({ ...payload, id: initial?.id })
    onDismiss()
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onDismiss}
      presentationStyle="pageSheet"
    >
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <View className="flex-row items-center justify-between border-b border-brand-100 px-6 py-4">
          <UIText variant="subheading">
            {initial?.id ? 'Ausbildung bearbeiten' : 'Neue Ausbildung'}
          </UIText>
          <Pressable onPress={onDismiss}>
            <Text className="text-base text-brand-500">Abbrechen</Text>
          </Pressable>
        </View>

        <FormScroll
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingVertical: 24,
            paddingBottom: 48,
          }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="gap-4">
            <Controller
              control={control}
              name="title"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Titel"
                  value={value}
                  onChangeText={onChange}
                  error={errors.title?.message}
                  placeholder="z.B. Ausbildung zum Elektroniker"
                />
              )}
            />
            <MonthYearPicker
              label="Start"
              value={{ month: startMonth, year: startYear }}
              onChange={(v) => {
                if (v) {
                  setValue('startMonth', v.month)
                  setValue('startYear', v.year)
                }
              }}
            />
            <Switch
              label="Laeuft noch"
              value={isOngoing}
              onValueChange={(v) => {
                setIsOngoing(v)
                if (v) {
                  setValue('endMonth', null)
                  setValue('endYear', null)
                }
              }}
            />
            {!isOngoing && (
              <MonthYearPicker
                label="Ende"
                value={
                  endMonth != null && endYear != null
                    ? { month: endMonth, year: endYear }
                    : null
                }
                onChange={(v) => {
                  setValue('endMonth', v?.month ?? null)
                  setValue('endYear', v?.year ?? null)
                }}
              />
            )}
            {errors.endYear?.message && (
              <Text className="text-sm text-red-600">{errors.endYear.message}</Text>
            )}
            <Controller
              control={control}
              name="status"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Status (optional)"
                  value={value ?? ''}
                  onChangeText={onChange}
                  placeholder="z.B. erfolgreich abgeschlossen"
                />
              )}
            />
            <View className="gap-1.5">
              <Text className="text-sm font-medium text-brand-800">
                Inhalte (eine pro Zeile, optional)
              </Text>
              <Controller
                control={control}
                name="description"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    value={value ?? ''}
                    onChangeText={onChange}
                    placeholder={
                      'z.B.\nSPS-Programmierung\nWartung von Anlagen'
                    }
                    placeholderTextColor="#829FB8"
                    multiline
                    textAlignVertical="top"
                    className="min-h-32 rounded-lg border border-brand-200 px-4 py-4 text-base text-brand-900"
                  />
                )}
              />
            </View>
          </View>

          <View className="mt-8">
            <Button onPress={handleSubmit(onSubmit)} disabled={isSubmitting}>
              Speichern
            </Button>
          </View>
        </FormScroll>
      </SafeAreaView>
    </Modal>
  )
}
