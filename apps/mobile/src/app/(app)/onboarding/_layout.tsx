// Wizard layout. Header contains the small logo, current step label, and a
// segmented progress bar that lights up per step as data lands in the DB.

import { Slot, useSegments } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { View } from 'react-native'

import {
  useEducations,
  useSeekerProfile,
  useSeekerSkills,
  useWorkExperiences,
} from '@/lib/seeker'
import { LogoMark } from '@/components/ui/logo-mark'
import { SegmentedProgressBar, type Segment } from '@/components/ui/progress-bar'
import { Text } from '@/components/ui/text'

const STEPS = [
  'upload',
  'beruf',
  'basics',
  'erfahrung',
  'ausbildung',
  'skills',
  'preview',
  'notifications',
] as const

type StepName = (typeof STEPS)[number]

const STEP_LABEL: Record<StepName, string> = {
  upload: 'CV-Upload',
  beruf: 'Berufsbezeichnung',
  basics: 'Basis-Daten',
  erfahrung: 'Berufserfahrung',
  ausbildung: 'Ausbildung',
  skills: 'Skills',
  preview: 'Vorschau',
  notifications: 'Benachrichtigungen',
}

export default function OnboardingLayout() {
  const segments = useSegments()
  const currentSegment = segments[segments.length - 1] as StepName | undefined
  const stepIndex = currentSegment ? STEPS.indexOf(currentSegment) : -1
  const label = currentSegment && STEP_LABEL[currentSegment] ? STEP_LABEL[currentSegment] : ''

  const { profile, seeker } = useSeekerProfile()
  const { items: workExperiences } = useWorkExperiences()
  const { items: educations } = useEducations()
  const { items: skills } = useSeekerSkills()

  const complete: Record<StepName, boolean> = {
    upload: Boolean(seeker?.job_title),
    beruf: Boolean(seeker?.job_title),
    basics: Boolean(
      profile?.first_name &&
        profile?.last_name &&
        seeker?.postal_code &&
        seeker?.city &&
        seeker?.available_from,
    ),
    erfahrung: workExperiences.length > 0,
    ausbildung: educations.length > 0,
    skills: skills.length > 0,
    preview: Boolean(seeker?.cv_approved_at),
    notifications: false,
  }

  const progress: Segment[] = STEPS.map((name, i) => ({
    active: i === stepIndex,
    complete: complete[name],
  }))

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <View className="border-b border-brand-100 px-6 py-3">
        <View className="flex-row items-center justify-between">
          <LogoMark size="sm" />
          <Text variant="muted">{label !== '' ? label : `Schritt ${stepIndex + 1} von ${STEPS.length}`}</Text>
        </View>
        <View className="mt-2">
          <SegmentedProgressBar steps={progress} />
        </View>
      </View>
      <Slot />
    </SafeAreaView>
  )
}
