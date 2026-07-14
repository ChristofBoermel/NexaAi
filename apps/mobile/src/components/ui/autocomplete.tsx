// Text input with a dropdown list of suggestions filtered by the input text.
// Caller supplies the full option list; filtering is local and case-insensitive.

import { useMemo, useState } from 'react'
import { FlatList, Pressable, Text, TextInput, View } from 'react-native'

type Option = { id: string; label: string }

export function Autocomplete({
  label,
  options,
  onSelect,
  placeholder = 'Suchen...',
  disabled = false,
  emptyLabel = 'Keine Treffer',
  maxResults = 8,
}: {
  label: string
  options: Option[]
  onSelect: (option: Option) => void
  placeholder?: string
  disabled?: boolean
  emptyLabel?: string
  maxResults?: number
}) {
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return options
      .filter((o) => o.label.toLowerCase().includes(q))
      .slice(0, maxResults)
  }, [query, options, maxResults])

  const showDropdown = focused && query.trim().length > 0

  return (
    <View className="gap-1.5">
      <Text className="text-sm font-medium text-brand-800">{label}</Text>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder={placeholder}
        placeholderTextColor="#829FB8"
        editable={!disabled}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 150)}
        className={`rounded-lg border border-brand-200 px-4 py-4 text-base text-brand-900 ${
          disabled ? 'opacity-50' : ''
        }`}
      />

      {showDropdown && (
        <View className="rounded-lg border border-brand-200 bg-white">
          {filtered.length === 0 ? (
            <View className="px-4 py-3">
              <Text className="text-sm text-brand-500">{emptyLabel}</Text>
            </View>
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={(item) => item.id}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    onSelect(item)
                    setQuery('')
                  }}
                  className="border-b border-brand-100 px-4 py-3"
                >
                  <Text className="text-base text-brand-900">{item.label}</Text>
                </Pressable>
              )}
            />
          )}
        </View>
      )}
    </View>
  )
}
