// Onboarding Step 5: Skills (max 6).
// Autocomplete waehlt Skills aus dem Katalog. Ausgewaehlte Skills als Chips.

import { useEffect, useMemo, useState } from 'react'
import { ScrollView, View } from 'react-native'
import { useRouter } from 'expo-router'

import { useSession } from '@/lib/auth'
import {
  saveSeekerSkills,
  useAllSkills,
  useSeekerSkills,
  type SkillRow,
} from '@/lib/seeker'
import { Autocomplete } from '@/components/ui/autocomplete'
import { Button } from '@/components/ui/button'
import { Chip } from '@/components/ui/chip'
import { Text as UIText } from '@/components/ui/text'

const MAX_SKILLS = 6

export default function Skills() {
  const router = useRouter()
  const { session } = useSession()
  const userId = session?.user.id
  const { items: allSkills, isLoading: catalogLoading } = useAllSkills()
  const { items: initialSelected, isLoading: selectionLoading } = useSeekerSkills()

  const [selected, setSelected] = useState<SkillRow[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelected(initialSelected)
  }, [initialSelected])

  const options = useMemo(() => {
    const selectedIds = new Set(selected.map((s) => s.id))
    return allSkills
      .filter((s) => !selectedIds.has(s.id))
      .map((s) => ({ id: s.id, label: s.display_name }))
  }, [allSkills, selected])

  const isMaxReached = selected.length >= MAX_SKILLS

  const addSkill = (option: { id: string; label: string }) => {
    if (isMaxReached) return
    const skill = allSkills.find((s) => s.id === option.id)
    if (!skill) return
    setSelected((prev) => [...prev, skill])
  }

  const removeSkill = (id: string) => {
    setSelected((prev) => prev.filter((s) => s.id !== id))
  }

  const onNext = async () => {
    if (!userId) return
    setSaving(true)
    const { error } = await saveSeekerSkills(userId, selected.map((s) => s.id))
    setSaving(false)
    if (error) return
    router.push('/(app)/onboarding/preview')
  }

  if (catalogLoading || selectionLoading) {
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
      keyboardShouldPersistTaps="handled"
    >
      <UIText variant="heading">Skills</UIText>
      <View className="mt-2">
        <UIText variant="muted">
          {`Waehle bis zu ${MAX_SKILLS} Skills aus, die dich am besten beschreiben.`}
        </UIText>
      </View>

      <View className="mt-6">
        {selected.length > 0 ? (
          <View className="flex-row flex-wrap gap-2">
            {selected.map((s) => (
              <Chip key={s.id} onRemove={() => removeSkill(s.id)}>
                {s.display_name}
              </Chip>
            ))}
          </View>
        ) : (
          <UIText variant="muted">Noch keine Skills ausgewaehlt.</UIText>
        )}
      </View>

      <View className="mt-6">
        <Autocomplete
          label={isMaxReached ? `Maximum von ${MAX_SKILLS} erreicht` : 'Skill suchen'}
          options={options}
          onSelect={addSkill}
          placeholder="z.B. TIA Portal"
          disabled={isMaxReached}
        />
      </View>

      <View className="mt-8">
        <Button onPress={onNext} disabled={saving || selected.length === 0}>
          Weiter
        </Button>
      </View>
    </ScrollView>
  )
}
