// Fullscreen modal showing the complete job description plus swipe CTAs.
// Used when the seeker taps a card in the feed.

import { Modal, Pressable, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'

import { brand, neutral } from '@/lib/colors'
import type { MatchWithJob } from '@/lib/jobs'
import { Button } from '@/components/ui/button'
import { FormScroll } from '@/components/ui/form-scroll'
import { Text as UIText } from '@/components/ui/text'

function salaryLabel(min: number | null, max: number | null): string {
  if (min == null && max == null) return 'Gehalt auf Anfrage'
  if (min != null && max != null) {
    return `${min.toLocaleString('de-DE')} – ${max.toLocaleString('de-DE')} EUR`
  }
  if (min != null) return `ab ${min.toLocaleString('de-DE')} EUR`
  return `bis ${max?.toLocaleString('de-DE')} EUR`
}

export function JobDetailModal({
  match,
  onDismiss,
  onLike,
  onPass,
}: {
  match: MatchWithJob | null
  onDismiss: () => void
  onLike: () => void
  onPass: () => void
}) {
  const visible = match !== null

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onDismiss}
      presentationStyle="pageSheet"
    >
      {match && (
        <SafeAreaView className="flex-1 bg-white" edges={['top']}>
          <View className="flex-row items-center justify-between border-b border-brand-100 px-6 py-4">
            <UIText variant="subheading">{match.job.title}</UIText>
            <Pressable
              onPress={onDismiss}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              accessibilityLabel="Schließen"
              accessibilityRole="button"
            >
              <Ionicons name="close" size={24} color={brand[500]} />
            </Pressable>
          </View>

          <FormScroll
            contentContainerStyle={{
              paddingHorizontal: 24,
              paddingVertical: 24,
              paddingBottom: 32,
            }}
          >
            <View className="flex-row items-center justify-between">
              <UIText variant="muted">
                {match.job.company.show_anonymous
                  ? match.job.company.pseudonym
                  : match.job.company.display_name}
              </UIText>
              <View className="items-center rounded-full bg-brand-100 px-3 py-1">
                <Text className="text-sm font-bold text-brand-800">
                  {match.score_pct}% Match
                </Text>
              </View>
            </View>

            <View className="mt-6 gap-3">
              <View className="flex-row items-center gap-2">
                <Ionicons name="location-outline" size={18} color={brand[500]} />
                <Text className="text-base text-brand-900">
                  {match.job.remote_ok ? 'Remote möglich' : 'Standort in Beschreibung'}
                </Text>
              </View>
              <View className="flex-row items-center gap-2">
                <Ionicons name="cash-outline" size={18} color={brand[500]} />
                <Text className="text-base text-brand-900">
                  {salaryLabel(match.job.salary_min_eur, match.job.salary_max_eur)}
                </Text>
              </View>
            </View>

            {match.job.description && (
              <View className="mt-6">
                <UIText variant="subheading">Beschreibung</UIText>
                <View className="mt-2 h-px bg-brand-200" />
                <View className="mt-3">
                  <Text className="text-base leading-6 text-brand-900">
                    {match.job.description}
                  </Text>
                </View>
              </View>
            )}
          </FormScroll>

          <View className="border-t border-brand-100 px-6 py-4">
            <View className="flex-row gap-3">
              <View className="flex-1">
                <Button
                  variant="ghost"
                  onPress={onPass}
                  leadingIcon={
                    <Ionicons name="close" size={20} color={brand[800]} />
                  }
                >
                  Pass
                </Button>
              </View>
              <View className="flex-1">
                <Button
                  onPress={onLike}
                  leadingIcon={
                    <Ionicons name="heart" size={20} color={neutral.white} />
                  }
                >
                  Interesse
                </Button>
              </View>
            </View>
          </View>
        </SafeAreaView>
      )}
    </Modal>
  )
}
