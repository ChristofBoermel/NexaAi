// Pill-shaped tag. Optional remove button on the right.

import { type ReactNode } from 'react'
import { Pressable, Text, View } from 'react-native'

export function Chip({
  children,
  onRemove,
}: {
  children: ReactNode
  onRemove?: () => void
}) {
  return (
    <View className="flex-row items-center gap-2 rounded-full bg-brand-100 px-3 py-1.5">
      <Text className="text-sm text-brand-800">{children}</Text>
      {onRemove && (
        <Pressable
          onPress={onRemove}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text className="px-1 font-bold text-brand-800">x</Text>
        </Pressable>
      )}
    </View>
  )
}
