// Onboarding Step 6: Preview + Approve.
// Rendert den fertigen CV genau wie er später Recruitern gezeigt wird.

import { ScrollView, View } from 'react-native'
import { useRouter } from 'expo-router'

import { useSession } from '@/lib/auth'
import {
  approveCv,
  useEducations,
  useSeekerProfile,
  useSeekerSkills,
  useWorkExperiences,
} from '@/lib/seeker'
import { Button } from '@/components/ui/button'
import { Text } from '@/components/ui/text'
import { CvView } from '@/components/cv/cv-view'

export default function Preview() {
  const router = useRouter()
  const { session } = useSession()
  const userId = session?.user.id
  const { profile, seeker, isLoading: p1 } = useSeekerProfile()
  const { items: workExperiences, isLoading: p2 } = useWorkExperiences()
  const { items: educations, isLoading: p3 } = useEducations()
  const { items: skills, isLoading: p4 } = useSeekerSkills()

  const onApprove = async () => {
    if (!userId) return
    const { error } = await approveCv(userId)
    if (error) return
    router.replace('/(app)')
  }

  const loading = p1 || p2 || p3 || p4

  if (loading) {
    return <View className="flex-1 bg-white" />
  }

  return (
    <ScrollView
      className="flex-1 bg-white"
      contentContainerStyle={{
        paddingHorizontal: 24,
        paddingVertical: 24,
        paddingBottom: 48,
      }}
    >
      <Text variant="heading">Deine Vorschau</Text>
      <View className="mt-2">
        <Text variant="muted">
          So sehen Recruiter deinen Lebenslauf nach einem Match.
        </Text>
      </View>

      <View className="mt-8">
        <CvView
          profile={profile}
          seeker={seeker}
          workExperiences={workExperiences}
          educations={educations}
          skills={skills}
        />
      </View>

      <View className="mt-10 gap-3">
        <Button onPress={onApprove}>Freigeben</Button>
        <Button variant="ghost" onPress={() => router.back()}>
          Zurück bearbeiten
        </Button>
      </View>
    </ScrollView>
  )
}
