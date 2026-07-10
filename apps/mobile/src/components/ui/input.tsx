// Input primitive with label and error message.

import { Text, TextInput, View } from 'react-native'

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
    <View className="gap-1">
      <Text className="text-sm font-medium text-neutral-700">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
        className="rounded-lg border border-neutral-300 px-4 py-3 text-base text-neutral-900"
      />
      {error && <Text className="text-sm text-red-600">{error}</Text>}
    </View>
  )
}
