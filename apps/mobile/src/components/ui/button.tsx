// Button primitive.

import { type ReactNode } from 'react'
import { Pressable, Text } from 'react-native'

type VariantStyles = Record<string, string>

const variantStyles: VariantStyles = {
  primary: 'rounded-lg bg-neutral-900 px-6 py-3',
  ghost: 'rounded-lg px-6 py-3',
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
      <Text
        className={`text-base font-semibold ${variant === 'ghost' ? 'text-neutral-900' : 'text-white'}`}
      >
        {children}
      </Text>
    </Pressable>
  )
}
