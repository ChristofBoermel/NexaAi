// Home. Nach erfolgreichem Onboarding zeigt sie den freigegebenen CV.
// Solange cv_approved_at null ist, gehen wir direkt in den Wizard.

import { Redirect, useRouter } from 'expo-router'
import { ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'

import { signOut } from '@/lib/auth'
import { brand, neutral } from '@/lib/colors'
import {
  useEducations,
  useSeekerProfile,
  useSeekerSkills,
  useWorkExperiences,
} from '@/lib/seeker'
import { Button } from '@/components/ui/button'
import { LogoMark } from '@/components/ui/logo-mark'
import { CvSkeleton } from '@/components/ui/skeleton'
import { CvView } from '@/components/cv/cv-view'

export default function Home() {
  const router = useRouter()
  const { profile, seeker, isLoading: p1 } = useSeekerProfile()
  const { items: workExperiences, isLoading: p2 } = useWorkExperiences()
  const { items: educations, isLoading: p3 } = useEducations()
  const { items: skills, isLoading: p4 } = useSeekerSkills()

  const loading = p1 || p2 || p3 || p4

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 px-6 py-6">
          <View className="items-center">
            <LogoMark size="md" />
          </View>
          <View className="mt-8">
            <CvSkeleton />
          </View>
        </View>
      </SafeAreaView>
    )
  }

  if (!seeker || seeker.cv_approved_at == null) {
    return <Redirect href="/(app)/onboarding/beruf" />
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingVertical: 24,
          paddingBottom: 48,
        }}
      >
        <View className="items-center">
          <LogoMark size="md" />
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
          <Button
            onPress={() => router.push('/(app)/onboarding/beruf')}
            leadingIcon={<Ionicons name="create-outline" size={20} color={neutral.white} />}
          >
            Bearbeiten
          </Button>
          <Button
            variant="ghost"
            onPress={() => signOut()}
            leadingIcon={<Ionicons name="log-out-outline" size={20} color={brand[800]} />}
          >
            Abmelden
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
