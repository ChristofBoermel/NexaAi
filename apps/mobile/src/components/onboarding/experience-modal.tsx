// Add/edit modal for a single work-experience row.
// Handles the "aktuelle Anstellung" toggle (nulls out end month + end year).

import { useEffect, useState } from 'react'
import { Modal, Pressable, Text, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Ionicons } from '@expo/vector-icons'

import { workExperienceSchema, type WorkExperienceInput } from '@nexaai/types'

import { brand } from '@/lib/colors'
import { Button } from '@/components/ui/button'
import { FormScroll } from '@/components/ui/form-scroll'
import { Input } from '@/components/ui/input'
import { MonthYearPicker } from '@/components/ui/month-year-picker'
import { Switch } from '@/components/ui/switch'
import { Text as UIText } from '@/components/ui/text'

export type ExperienceInitial = Partial<WorkExperienceInput> & { id?: string }

export function ExperienceModal({
  visible,
  initial,
  onDismiss,
  onSave,
}: {
  visible: boolean
  initial: ExperienceInitial | null
  onDismiss: () => void
  onSave: (data: WorkExperienceInput & { id?: string }) => Promise<void>
}) {
  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<WorkExperienceInput>({
    resolver: zodResolver(workExperienceSchema),
    defaultValues: {
      title: '',
      subtitle: '',
      startMonth: 1,
      startYear: new Date().getFullYear(),
      endMonth: null,
      endYear: null,
      description: '',
    },
  })

  const [isCurrent, setIsCurrent] = useState(false)

  useEffect(() => {
    if (!visible) return
    reset({
      title: initial?.title ?? '',
      subtitle: initial?.subtitle ?? '',
      startMonth: initial?.startMonth ?? 1,
      startYear: initial?.startYear ?? new Date().getFullYear(),
      endMonth: initial?.endMonth ?? null,
      endYear: initial?.endYear ?? null,
      description: initial?.description ?? '',
    })
    setIsCurrent(initial?.endMonth == null && initial?.endYear == null)
  }, [visible, initial, reset])

  const startMonth = watch('startMonth')
  const startYear = watch('startYear')
  const endMonth = watch('endMonth')
  const endYear = watch('endYear')

  const onSubmit = async (data: WorkExperienceInput) => {
    const payload = isCurrent
      ? { ...data, endMonth: null, endYear: null }
      : data
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
            {initial?.id ? 'Erfahrung bearbeiten' : 'Neue Erfahrung'}
          </UIText>
          <Pressable
            onPress={onDismiss}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityLabel="Schließen"
            accessibilityRole="button"
          >
            <Ionicons name="close" size={24} color={brand[500]} />
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
                  placeholder="z.B. Anlagenmechaniker SHK"
                />
              )}
            />
            <Controller
              control={control}
              name="subtitle"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Zusatz (optional)"
                  value={value ?? ''}
                  onChangeText={onChange}
                  error={errors.subtitle?.message}
                  placeholder="z.B. bei der Deutschen Bahn"
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
              label="Aktuelle Anstellung"
              value={isCurrent}
              onValueChange={(v) => {
                setIsCurrent(v)
                if (v) {
                  setValue('endMonth', null)
                  setValue('endYear', null)
                }
              }}
            />
            {!isCurrent && (
              <MonthYearPicker
                label="Ende"
                value={endMonth != null && endYear != null ? { month: endMonth, year: endYear } : null}
                onChange={(v) => {
                  setValue('endMonth', v?.month ?? null)
                  setValue('endYear', v?.year ?? null)
                }}
              />
            )}
            {errors.endYear?.message && (
              <Text className="text-sm text-red-600">{errors.endYear.message}</Text>
            )}
            <View className="gap-1.5">
              <Text className="text-sm font-medium text-brand-800">
                Aufgaben (eine pro Zeile)
              </Text>
              <Controller
                control={control}
                name="description"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    value={value ?? ''}
                    onChangeText={onChange}
                    placeholder={
                      'z.B.\nWartung und Reparatur von Sanitäranlagen\nDichtheitsprüfungen'
                    }
                    placeholderTextColor={brand[300]}
                    multiline
                    textAlignVertical="top"
                    className="min-h-32 rounded-lg border border-brand-200 px-4 py-4 text-base text-brand-900"
                  />
                )}
              />
            </View>
          </View>

          <View className="mt-8">
            <Button onPress={handleSubmit(onSubmit)} loading={isSubmitting}>
              Speichern
            </Button>
          </View>
        </FormScroll>
      </SafeAreaView>
    </Modal>
  )
}
