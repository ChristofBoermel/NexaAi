// Minimal date picker: text input formatted dd.mm.yyyy that maps to ISO
// YYYY-MM-DD. No native module (we can polish with a real calendar later).

import { Text, TextInput, View } from 'react-native'

function toDisplay(iso: string | null | undefined): string {
  if (!iso) return ''
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!match) return ''
  return `${match[3]}.${match[2]}.${match[1]}`
}

function toIso(display: string): string {
  const match = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(display)
  if (!match) return display
  return `${match[3]}-${match[2]}-${match[1]}`
}

export function DatePicker({
  label,
  value,
  onChangeIso,
  error,
  placeholder = 'TT.MM.JJJJ',
}: {
  label: string
  value: string | null
  onChangeIso: (iso: string) => void
  error?: string
  placeholder?: string
}) {
  return (
    <View className="gap-1.5">
      <Text className="text-sm font-medium text-brand-800">{label}</Text>
      <TextInput
        value={toDisplay(value)}
        onChangeText={(text) => onChangeIso(toIso(text))}
        placeholder={placeholder}
        placeholderTextColor="#829FB8"
        keyboardType="numeric"
        maxLength={10}
        className={`rounded-lg border px-4 py-4 text-base text-brand-900 ${
          error ? 'border-red-500' : 'border-brand-200'
        }`}
      />
      {error && <Text className="text-sm text-red-600">{error}</Text>}
    </View>
  )
}
