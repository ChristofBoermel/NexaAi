// Pill-shaped tag. Optional remove button on the right.

import { type ReactNode } from 'react'
import { Pressable, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

import { brand } from '@/lib/colors'

export function Chip({
  children,
  onRemove,
  removeLabel = 'Entfernen',
}: {
  children: ReactNode
  onRemove?: () => void
  removeLabel?: string
}) {
  return (
    <View className="flex-row items-center gap-2 rounded-full bg-brand-100 px-3 py-1.5">
      <Text className="text-sm text-brand-800">{children}</Text>
      {onRemove && (
        <Pressable
          onPress={onRemove}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityLabel={removeLabel}
          accessibilityRole="button"
        >
          <Ionicons name="close" size={16} color={brand[800]} />
        </Pressable>
      )}
    </View>
  )
}
