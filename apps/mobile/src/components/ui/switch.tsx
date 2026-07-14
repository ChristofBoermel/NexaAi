// Labeled toggle. Left label, right native Switch, disabled dims the row.

import { Switch as RNSwitch, Text, View } from 'react-native'

export function Switch({
  label,
  value,
  onValueChange,
  disabled = false,
}: {
  label: string
  value: boolean
  onValueChange: (v: boolean) => void
  disabled?: boolean
}) {
  return (
    <View
      className={`flex-row items-center justify-between py-2 ${
        disabled ? 'opacity-50' : ''
      }`}
    >
      <Text className="text-base text-brand-900">{label}</Text>
      <RNSwitch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: '#B0C4D5', true: '#0E3652' }}
        thumbColor="#FFFFFF"
      />
    </View>
  )
}
