// Job card shown in the swipe deck. Compact by design: company pseudonym at
// the top, job title big, one-line meta below, match-score badge on the right.

import { Pressable, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

import { brand } from '@/lib/colors'
import type { MatchWithJob } from '@/lib/jobs'

function salaryLabel(min: number | null, max: number | null): string {
  if (min == null && max == null) return 'Gehalt auf Anfrage'
  if (min != null && max != null) {
    return `${min.toLocaleString('de-DE')} – ${max.toLocaleString('de-DE')} EUR`
  }
  if (min != null) return `ab ${min.toLocaleString('de-DE')} EUR`
  return `bis ${max?.toLocaleString('de-DE')} EUR`
}

export function JobCard({
  match,
  onTap,
}: {
  match: MatchWithJob
  onTap: () => void
}) {
  const { job } = match
  const company = job.company
  const companyName = company.show_anonymous ? company.pseudonym : company.display_name
  const locationParts: string[] = []
  if (job.remote_ok) locationParts.push('Remote möglich')

  return (
    <Pressable
      onPress={onTap}
      className="h-full rounded-2xl border border-brand-100 bg-white p-6"
      style={{
        shadowColor: brand[900],
        shadowOpacity: 0.08,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
        elevation: 4,
      }}
    >
      <View className="flex-row items-start justify-between">
        <View className="flex-1 pr-3">
          <Text className="text-sm font-medium text-brand-500">{companyName}</Text>
          <View className="mt-2">
            <Text className="text-2xl font-bold text-brand-800">{job.title}</Text>
          </View>
        </View>
        <View className="items-center rounded-full bg-brand-100 px-3 py-1">
          <Text className="text-lg font-bold text-brand-800">{match.score_pct}%</Text>
          <Text className="text-[10px] font-medium uppercase text-brand-500">Match</Text>
        </View>
      </View>

      <View className="mt-6 gap-2">
        <View className="flex-row items-center gap-2">
          <Ionicons name="location-outline" size={16} color={brand[500]} />
          <Text className="text-sm text-brand-900">
            {locationParts[0] ?? 'Standort in Beschreibung'}
          </Text>
        </View>
        <View className="flex-row items-center gap-2">
          <Ionicons name="cash-outline" size={16} color={brand[500]} />
          <Text className="text-sm text-brand-900">
            {salaryLabel(job.salary_min_eur, job.salary_max_eur)}
          </Text>
        </View>
      </View>

      <View className="mt-auto items-center pt-6">
        <Text className="text-xs text-brand-500">Tippen für Details</Text>
      </View>
    </Pressable>
  )
}
