// Button primitive.

import { type ReactNode } from 'react'
import { Pressable, Text } from 'react-native'

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
}: {
  children: ReactNode
  onPress: () => void
  variant?: 'primary' | 'ghost'
  disabled?: boolean
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={`${variantStyles[variant]} ${disabled ? 'opacity-50' : ''}`}
    >
      <Text className={textStyles[variant]}>{children}</Text>
    </Pressable>
  )
}
