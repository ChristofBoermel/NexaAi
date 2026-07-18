// Editorial job card. Company as caption eyebrow, title as display heading,
// match score as a big floating percentage rather than a decorative pill.
// Skill guidance: non-generic pattern, content-first, breathing room.

import { Pressable, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

import { brand } from '@/lib/colors'
import type { MatchWithJob } from '@/lib/jobs'
import { Text as UIText } from '@/components/ui/text'

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
  const locationLine = job.remote_ok ? 'Remote möglich' : 'Standort in Beschreibung'

  return (
    <Pressable
      onPress={onTap}
      className="h-full rounded-3xl bg-cream-50 p-7"
      style={{
        shadowColor: brand[950],
        shadowOpacity: 0.14,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 10 },
        elevation: 6,
      }}
    >
      <View className="flex-row items-start justify-between">
        <View className="flex-1 pr-4">
          <UIText variant="caption">{companyName}</UIText>
        </View>
        <View className="items-end">
          <Text className="text-4xl font-bold leading-none text-brand-800">
            {match.score_pct}
          </Text>
          <Text className="text-[10px] font-semibold uppercase tracking-widest text-brand-500">
            % Match
          </Text>
        </View>
      </View>

      <View className="mt-6">
        <UIText variant="display">{job.title}</UIText>
      </View>

      <View className="mt-auto gap-3 pt-8">
        <View className="flex-row items-center gap-3">
          <Ionicons name="location-outline" size={18} color={brand[500]} />
          <Text className="text-base text-brand-900">{locationLine}</Text>
        </View>
        <View className="flex-row items-center gap-3">
          <Ionicons name="cash-outline" size={18} color={brand[500]} />
          <Text className="text-base text-brand-900">
            {salaryLabel(job.salary_min_eur, job.salary_max_eur)}
          </Text>
        </View>

        <View className="mt-4 flex-row items-center gap-2">
          <Text className="text-xs uppercase tracking-widest text-brand-400">
            Tippen für Details
          </Text>
          <Ionicons name="arrow-forward" size={14} color={brand[400]} />
        </View>
      </View>
    </Pressable>
  )
}
