// Single education block. Same 2-column layout as CvExperienceBlock, but with
// an optional status line under the title (e.g. 'erfolgreich abgeschlossen').

import { Text, View } from 'react-native'

function formatRange(sm: number, sy: number, em: number | null, ey: number | null): string {
  const start = `${String(sm).padStart(2, '0')}.${sy}`
  if (em == null || ey == null) return `${start} - heute`
  return `${start} - ${String(em).padStart(2, '0')}.${ey}`
}

export function CvEducationBlock({
  startMonth,
  startYear,
  endMonth,
  endYear,
  title,
  status,
  description,
}: {
  startMonth: number
  startYear: number
  endMonth: number | null
  endYear: number | null
  title: string
  status: string | null
  description: string | null
}) {
  const bullets = (description ?? '')
    .split('\n')
    .map((s) => s.trim())
    .filter((s) => s.length > 0)

  return (
    <View className="flex-row gap-3 py-3">
      <View className="w-24">
        <Text className="text-xs font-semibold text-brand-800">
          {formatRange(startMonth, startYear, endMonth, endYear)}
        </Text>
      </View>
      <View className="flex-1">
        <Text className="text-base font-semibold text-brand-800">{title}</Text>
        {status && status !== '' && (
          <Text className="mt-0.5 text-sm text-brand-500">{status}</Text>
        )}
        {bullets.length > 0 && (
          <View className="mt-2 gap-1">
            {bullets.map((line, idx) => (
              <View key={idx} className="flex-row">
                <Text className="w-3 text-sm text-brand-900">{'•'}</Text>
                <Text className="flex-1 text-sm text-brand-900">{line}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  )
}
