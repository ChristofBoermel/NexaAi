// Horizontal step progress. Clamps overflow and division-by-zero.

import { View } from 'react-native'

export function ProgressBar({ step, total }: { step: number; total: number }) {
  const safeTotal = total > 0 ? total : 1
  const percent = Math.max(0, Math.min(100, (step / safeTotal) * 100))

  return (
    <View className="h-1.5 w-full overflow-hidden rounded-full bg-brand-100">
      <View
        className="h-full rounded-full bg-brand-800"
        style={{ width: `${percent}%` }}
      />
    </View>
  )
}
