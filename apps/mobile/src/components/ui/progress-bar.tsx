// Horizontal step progress. Two flavors:
//
// - ProgressBar (legacy): a single continuous bar filled by step/total.
// - SegmentedProgressBar: one small bar per step, tri-state coloring
//   (complete, active, pending) so the user can see which steps still need work.

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

export type Segment = { active: boolean; complete: boolean }

export function SegmentedProgressBar({ steps }: { steps: Segment[] }) {
  return (
    <View className="flex-row gap-1">
      {steps.map((s, i) => (
        <View
          key={i}
          className={`h-1.5 flex-1 rounded-full ${
            s.complete ? 'bg-brand-800' : s.active ? 'bg-brand-400' : 'bg-brand-100'
          }`}
        />
      ))}
    </View>
  )
}
