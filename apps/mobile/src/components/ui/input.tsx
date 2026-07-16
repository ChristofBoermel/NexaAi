// Input primitive with label, error message, and an optional show-password toggle.

import { useState } from 'react'
import { Pressable, Text, TextInput, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

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
  const [reveal, setReveal] = useState(false)
  const isPassword = Boolean(secureTextEntry)
  const effectivelySecure = isPassword && !reveal

  return (
    <View className="gap-1.5">
      <Text className="text-sm font-medium text-brand-800">{label}</Text>
      <View className="relative">
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={brand[300]}
          secureTextEntry={effectivelySecure}
          autoCapitalize={autoCapitalize}
          keyboardType={keyboardType}
          className={`rounded-lg border px-4 py-4 text-base text-brand-900 ${
            isPassword ? 'pr-12' : ''
          } ${error ? 'border-red-500' : 'border-brand-200'}`}
        />
        {isPassword && (
          <Pressable
            onPress={() => setReveal((r) => !r)}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            className="absolute right-3 top-0 h-full items-center justify-center"
            accessibilityLabel={reveal ? 'Passwort verbergen' : 'Passwort anzeigen'}
            accessibilityRole="button"
          >
            <Ionicons
              name={reveal ? 'eye-off-outline' : 'eye-outline'}
              size={22}
              color={brand[500]}
            />
          </Pressable>
        )}
      </View>
      {error && <Text className="text-sm text-red-600">{error}</Text>}
    </View>
  )
}
