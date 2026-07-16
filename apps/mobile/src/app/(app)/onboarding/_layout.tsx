// Wizard layout. Header contains the small logo, a step counter, and the
// progress bar. Each child screen renders inside a Slot. Back-Navigation
// funktioniert via expo-router history (Handy-Back-Button oder router.back()).

import { Slot, useSegments } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { View } from 'react-native'

import { LogoMark } from '@/components/ui/logo-mark'
import { ProgressBar } from '@/components/ui/progress-bar'
import { Text } from '@/components/ui/text'

const STEPS = ['beruf', 'basics', 'erfahrung', 'ausbildung', 'skills', 'preview'] as const

type StepName = (typeof STEPS)[number]

const STEP_LABEL: Record<StepName, string> = {
  beruf: 'Berufsbezeichnung',
  basics: 'Basis-Daten',
  erfahrung: 'Berufserfahrung',
  ausbildung: 'Ausbildung',
  skills: 'Skills',
  preview: 'Vorschau',
}

export default function OnboardingLayout() {
  const segments = useSegments()
  const currentSegment = segments[segments.length - 1] as StepName | undefined
  const stepIndex = currentSegment ? STEPS.indexOf(currentSegment) : -1
  const step = stepIndex >= 0 ? stepIndex + 1 : 1
  const label = currentSegment && STEP_LABEL[currentSegment] ? STEP_LABEL[currentSegment] : ''

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <View className="border-b border-brand-100 px-6 py-3">
        <View className="flex-row items-center justify-between">
          <LogoMark size="sm" />
          <Text variant="muted">{label !== '' ? label : `Schritt ${step} von ${STEPS.length}`}</Text>
        </View>
        <View className="mt-2">
          <ProgressBar step={step} total={STEPS.length} />
        </View>
      </View>
      <Slot />
    </SafeAreaView>
  )
}
