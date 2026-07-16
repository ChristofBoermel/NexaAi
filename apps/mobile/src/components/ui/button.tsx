// Button primitive. Supports leading icon and a loading spinner state.
// Loading forces disabled and swaps the label for an ActivityIndicator.

import { type ReactNode } from 'react'
import { ActivityIndicator, Pressable, Text, View } from 'react-native'

import { brand, neutral } from '@/lib/colors'

const variantStyles = {
  primary: 'rounded-lg bg-brand-800 active:bg-brand-900 px-6 py-4',
  ghost: 'rounded-lg px-6 py-4',
}

const textStyles = {
  primary: 'text-center text-base font-semibold text-white',
  ghost: 'text-center text-base font-semibold text-brand-800',
}

export function Button({
  children,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  leadingIcon,
}: {
  children: ReactNode
  onPress: () => void
  variant?: 'primary' | 'ghost'
  disabled?: boolean
  loading?: boolean
  leadingIcon?: ReactNode
}) {
  const effectivelyDisabled = disabled || loading
  const spinnerColor = variant === 'primary' ? neutral.white : brand[800]

  return (
    <Pressable
      onPress={onPress}
      disabled={effectivelyDisabled}
      className={`${variantStyles[variant]} ${effectivelyDisabled ? 'opacity-50' : ''}`}
    >
      {loading ? (
        <ActivityIndicator color={spinnerColor} />
      ) : (
        <View className="flex-row items-center justify-center gap-2">
          {leadingIcon}
          <Text className={textStyles[variant]}>{children}</Text>
        </View>
      )}
    </Pressable>
  )
}
