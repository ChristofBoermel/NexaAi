// Date picker backed by @react-native-community/datetimepicker.
// On iOS uses the modal spinner, on Android the calendar dialog. Value is
// stored as ISO YYYY-MM-DD to match the Zod schema.

import { useState } from 'react'
import { Platform, Pressable, Text, View } from 'react-native'
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker'

import { brand } from '@/lib/colors'

function toDisplay(iso: string | null | undefined): string {
  if (!iso) return ''
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!m) return ''
  return `${m[3]}.${m[2]}.${m[1]}`
}

function toIso(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function DatePicker({
  label,
  value,
  onChangeIso,
  error,
  placeholder = 'Datum wählen',
}: {
  label: string
  value: string | null
  onChangeIso: (iso: string) => void
  error?: string
  placeholder?: string
}) {
  const [show, setShow] = useState(false)
  const display = toDisplay(value)
  const initial = value ? new Date(value) : new Date()

  const onChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') setShow(false)
    if (event.type === 'set' && selected) onChangeIso(toIso(selected))
  }

  return (
    <View className="gap-1.5">
      <Text className="text-sm font-medium text-brand-800">{label}</Text>
      <Pressable
        onPress={() => setShow(true)}
        className={`rounded-lg border px-4 py-4 ${
          error ? 'border-red-500' : 'border-brand-200'
        }`}
      >
        <Text className={display ? 'text-base text-brand-900' : 'text-base text-brand-300'}>
          {display || placeholder}
        </Text>
      </Pressable>
      {show && (
        <DateTimePicker
          value={initial}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onChange}
        />
      )}
      {show && Platform.OS === 'ios' && (
        <View className="mt-2 flex-row justify-end">
          <Pressable onPress={() => setShow(false)}>
            <Text className="text-base font-semibold text-brand-800">Fertig</Text>
          </Pressable>
        </View>
      )}
      {error && <Text className="text-sm text-red-600">{error}</Text>}
    </View>
  )
}
