// Onboarding Step 4: Ausbildung.
// Analog zu erfahrung: Liste + Modal zum Add/Edit + Delete-X.

import { useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

import { type EducationInput } from '@nexaai/types'

import { brand } from '@/lib/colors'

import { useSession } from '@/lib/auth'
import {
  deleteEducation,
  upsertEducation,
  useEducations,
  type EducationRow,
} from '@/lib/seeker'
import { Button } from '@/components/ui/button'
import { Text as UIText } from '@/components/ui/text'
import {
  EducationModal,
  type EducationInitial,
} from '@/components/onboarding/education-modal'

function formatRange(row: EducationRow): string {
  const startStr = `${String(row.start_month).padStart(2, '0')}.${row.start_year}`
  if (row.end_year == null || row.end_month == null) return `${startStr} - heute`
  return `${startStr} - ${String(row.end_month).padStart(2, '0')}.${row.end_year}`
}

export default function Ausbildung() {
  const router = useRouter()
  const { session } = useSession()
  const userId = session?.user.id
  const { items, isLoading, refetch } = useEducations()

  const [modalVisible, setModalVisible] = useState(false)
  const [editing, setEditing] = useState<EducationInitial | null>(null)

  const openAdd = () => {
    setEditing(null)
    setModalVisible(true)
  }

  const openEdit = (row: EducationRow) => {
    setEditing({
      id: row.id,
      title: row.title,
      startMonth: row.start_month,
      startYear: row.start_year,
      endMonth: row.end_month,
      endYear: row.end_year,
      status: row.status,
      description: row.description,
    })
    setModalVisible(true)
  }

  const onSave = async (data: EducationInput & { id?: string }) => {
    if (!userId) return
    const nextSortOrder = items.length > 0 ? items[0].sort_order - 1 : 0
    await upsertEducation(userId, {
      ...data,
      sortOrder: data.id
        ? items.find((r) => r.id === data.id)?.sort_order ?? nextSortOrder
        : nextSortOrder,
    })
    await refetch()
  }

  const onDelete = async (id: string) => {
    await deleteEducation(id)
    await refetch()
  }

  if (isLoading) {
    return <View className="flex-1 bg-white" />
  }

  return (
    <View className="flex-1 bg-white">
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingVertical: 24,
          paddingBottom: 48,
        }}
      >
        <UIText variant="heading">Ausbildung</UIText>
        <View className="mt-2">
          <UIText variant="muted">Schule, Ausbildung, Studium. Neueste zuerst.</UIText>
        </View>

        <View className="mt-6 gap-3">
          {items.map((row) => (
            <Pressable
              key={row.id}
              onPress={() => openEdit(row)}
              className="rounded-lg border border-brand-200 px-4 py-4"
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-1 pr-3">
                  <Text className="text-base font-semibold text-brand-800">
                    {row.title}
                  </Text>
                  {row.status != null && row.status !== '' && (
                    <Text className="mt-0.5 text-sm text-brand-500">
                      {row.status}
                    </Text>
                  )}
                  <Text className="mt-1 text-sm text-brand-500">
                    {formatRange(row)}
                  </Text>
                </View>
                <Pressable
                  onPress={() => onDelete(row.id)}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  accessibilityLabel="Ausbildung loeschen"
                  accessibilityRole="button"
                >
                  <Ionicons name="trash-outline" size={20} color={brand[500]} />
                </Pressable>
              </View>
            </Pressable>
          ))}

          {items.length === 0 && (
            <View className="rounded-lg border border-dashed border-brand-200 px-4 py-6">
              <UIText variant="muted">Noch keine Ausbildung erfasst.</UIText>
            </View>
          )}
        </View>

        <View className="mt-4">
          <Button variant="ghost" onPress={openAdd}>
            Neue Ausbildung hinzufuegen
          </Button>
        </View>

        <View className="mt-8">
          <Button onPress={() => router.push('/(app)/onboarding/skills')}>
            Weiter
          </Button>
        </View>
      </ScrollView>

      <EducationModal
        visible={modalVisible}
        initial={editing}
        onDismiss={() => setModalVisible(false)}
        onSave={onSave}
      />
    </View>
  )
}
