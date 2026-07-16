// Month + year picker without native modules. Two scrollable lists inside a
// modal. Value is passed as { month, year } objects, null means no selection.

import { useState } from 'react'
import { FlatList, Modal, Pressable, Text, View } from 'react-native'

const MONTH_LABELS = [
  'Januar', 'Februar', 'Maerz', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
]

const currentYear = new Date().getFullYear()
const YEARS = Array.from({ length: 60 }, (_, i) => currentYear + 5 - i)

type Value = { month: number; year: number }

export function MonthYearPicker({
  label,
  value,
  onChange,
  allowClear = false,
  placeholder = 'Bitte wählen',
}: {
  label: string
  value: Value | null
  onChange: (v: Value | null) => void
  allowClear?: boolean
  placeholder?: string
}) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<Value>(
    value ?? { month: new Date().getMonth() + 1, year: currentYear },
  )

  const display = value
    ? `${MONTH_LABELS[value.month - 1]} ${value.year}`
    : placeholder

  return (
    <View className="gap-1.5">
      <Text className="text-sm font-medium text-brand-800">{label}</Text>
      <Pressable
        onPress={() => {
          setDraft(value ?? { month: new Date().getMonth() + 1, year: currentYear })
          setOpen(true)
        }}
        className="rounded-lg border border-brand-200 px-4 py-4"
      >
        <Text className={value ? 'text-base text-brand-900' : 'text-base text-brand-300'}>
          {display}
        </Text>
      </Pressable>

      <Modal
        transparent
        visible={open}
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <View className="flex-1 items-center justify-center bg-black/40 px-6">
          <View className="w-full rounded-2xl bg-white p-6">
            <Text className="text-lg font-bold text-brand-800">{label}</Text>

            <View className="mt-4 flex-row gap-4">
              <View className="flex-1">
                <Text className="mb-2 text-sm text-brand-500">Monat</Text>
                <FlatList
                  data={MONTH_LABELS}
                  keyExtractor={(item, idx) => `${idx}-${item}`}
                  style={{ maxHeight: 200 }}
                  renderItem={({ item, index }) => (
                    <Pressable
                      onPress={() => setDraft((d) => ({ ...d, month: index + 1 }))}
                      className={`py-2 ${
                        draft.month === index + 1 ? 'bg-brand-100' : ''
                      }`}
                    >
                      <Text
                        className={
                          draft.month === index + 1
                            ? 'text-center text-base font-semibold text-brand-800'
                            : 'text-center text-base text-brand-900'
                        }
                      >
                        {item}
                      </Text>
                    </Pressable>
                  )}
                />
              </View>

              <View className="flex-1">
                <Text className="mb-2 text-sm text-brand-500">Jahr</Text>
                <FlatList
                  data={YEARS}
                  keyExtractor={(year) => `y-${year}`}
                  style={{ maxHeight: 200 }}
                  renderItem={({ item: year }) => (
                    <Pressable
                      onPress={() => setDraft((d) => ({ ...d, year }))}
                      className={`py-2 ${draft.year === year ? 'bg-brand-100' : ''}`}
                    >
                      <Text
                        className={
                          draft.year === year
                            ? 'text-center text-base font-semibold text-brand-800'
                            : 'text-center text-base text-brand-900'
                        }
                      >
                        {year}
                      </Text>
                    </Pressable>
                  )}
                />
              </View>
            </View>

            <View className="mt-6 flex-row justify-end gap-2">
              {allowClear && value && (
                <Pressable
                  onPress={() => {
                    onChange(null)
                    setOpen(false)
                  }}
                  className="rounded-lg px-4 py-2"
                >
                  <Text className="text-base text-brand-500">Löschen</Text>
                </Pressable>
              )}
              <Pressable
                onPress={() => setOpen(false)}
                className="rounded-lg px-4 py-2"
              >
                <Text className="text-base text-brand-500">Abbrechen</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  onChange(draft)
                  setOpen(false)
                }}
                className="rounded-lg bg-brand-800 px-4 py-2"
              >
                <Text className="text-base font-semibold text-white">Übernehmen</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}
