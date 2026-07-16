// Input primitive with label and error message.

import { Text, TextInput, View } from 'react-native'

import { brand } from '@/lib/colors'

export function Input({
  label,
  value,
  onChangeText,
  error,
  placeholder,
  secureTextEntry,
  autoCapitalize,
  keyboardType,
}: {
  label: string
  value: string
  onChangeText: (t: string) => void
  error?: string
  placeholder?: string
  secureTextEntry?: boolean
  autoCapitalize?: 'none' | 'sentences'
  keyboardType?: 'default' | 'email-address'
}) {
  return (
    <View className="gap-1.5">
      <Text className="text-sm font-medium text-brand-800">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={brand[300]}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
        className={`rounded-lg border px-4 py-4 text-base text-brand-900 ${
          error ? 'border-red-500' : 'border-brand-200'
        }`}
      />
      {error && <Text className="text-sm text-red-600">{error}</Text>}
    </View>
  )
}
