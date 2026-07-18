// Optional CV upload before the manual wizard.

import { useState } from 'react'
import { Text as RNText, View } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

import { useSession } from '@/lib/auth'
import { brand, neutral } from '@/lib/colors'
import { parseUploadedCv, pickCvPdf, uploadRawCv } from '@/lib/cv-upload'
import { Button } from '@/components/ui/button'
import { Text } from '@/components/ui/text'

export default function Upload() {
  const router = useRouter()
  const { session } = useSession()
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setSubmitting] = useState(false)
  const [summary, setSummary] = useState<string | null>(null)

  const continueManual = () => {
    router.push('/(app)/onboarding/beruf')
  }

  const onPick = async () => {
    if (!session?.user.id) return
    setSubmitting(true)
    setError(null)
    setSummary(null)

    const picked = await pickCvPdf()
    if (picked.error || !picked.asset) {
      setSubmitting(false)
      setError(picked.error)
      return
    }

    const uploaded = await uploadRawCv(session.user.id, picked.asset)
    if (uploaded.error || !uploaded.storagePath) {
      setSubmitting(false)
      setError(uploaded.error ?? 'Der Upload ist fehlgeschlagen')
      return
    }

    const parsed = await parseUploadedCv(uploaded.storagePath)
    setSubmitting(false)

    if (parsed.error || !parsed.draft) {
      setError(parsed.error ?? 'Der CV konnte nicht gelesen werden')
      return
    }

    const parts = [
      parsed.draft.basics.jobTitle ? 'Beruf' : null,
      parsed.draft.workExperiences.length > 0 ? 'Erfahrung' : null,
      parsed.draft.educations.length > 0 ? 'Ausbildung' : null,
    ].filter(Boolean)

    setSummary(
      parts.length > 0
        ? `Entwurf erkannt: ${parts.join(', ')}. Bitte prüfe alle Angaben im Wizard.`
        : 'Der Upload ist fertig. Bitte prüfe die Angaben im Wizard.',
    )
  }

  return (
    <View className="flex-1 bg-white px-6 py-8">
      <View className="h-14 w-14 items-center justify-center rounded-full bg-brand-50">
        <Ionicons name="document-text-outline" size={28} color={brand[800]} />
      </View>

      <View className="mt-8">
        <Text variant="heading">CV hochladen</Text>
        <View className="mt-3">
          <Text variant="muted">
            Lade optional eine PDF bis 5 MB hoch. Wir füllen daraus einen Entwurf vor, den du vor der Freigabe bearbeiten musst.
          </Text>
        </View>
      </View>

      {summary ? (
        <View className="mt-6 rounded-lg bg-brand-50 px-4 py-3">
          <RNText className="text-sm text-brand-700">{summary}</RNText>
        </View>
      ) : null}

      {error ? (
        <View className="mt-6 rounded-lg bg-red-50 px-4 py-3">
          <RNText className="text-sm text-red-700">{error}</RNText>
        </View>
      ) : null}

      <View className="mt-auto gap-3">
        <Button
          onPress={summary ? continueManual : onPick}
          loading={isSubmitting}
          leadingIcon={
            <Ionicons
              name={summary ? 'arrow-forward-outline' : 'cloud-upload-outline'}
              size={20}
              color={neutral.white}
            />
          }
        >
          {summary ? 'Entwurf prüfen' : 'PDF auswählen'}
        </Button>
        <Button variant="ghost" onPress={continueManual}>
          Ohne Upload starten
        </Button>
      </View>
    </View>
  )
}
