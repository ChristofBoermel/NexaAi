// CV header: "Ihr neuer {jobTitle} {firstName}" plus a 2-column info-table.
// Follows the Nexa Consulting PDF layout closely (see docs/example_docs).

import { Text, View } from 'react-native'

function formatDate(iso: string | null): string {
  if (!iso) return ''
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!m) return iso
  return `${m[3]}.${m[2]}.${m[1]}`
}

function computeAge(birthYear: number | null): string {
  if (!birthYear) return ''
  const current = new Date().getFullYear()
  return String(Math.max(0, current - birthYear))
}

type Props = {
  firstName: string | null
  jobTitle: string | null
  hasDriverLicense: boolean | null
  hasCar: boolean | null
  birthYear: number | null
  postalCode: string | null
  city: string | null
  availableFrom: string | null
  salaryEur: number | null
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row py-1">
      <View className="w-28">
        <Text className="text-sm font-semibold text-brand-800">{label}</Text>
      </View>
      <Text className="flex-1 text-sm text-brand-900">{value}</Text>
    </View>
  )
}

export function CvHeader({
  firstName,
  jobTitle,
  hasDriverLicense,
  hasCar,
  birthYear,
  postalCode,
  city,
  availableFrom,
  salaryEur,
}: Props) {
  const wohnort = [postalCode, city].filter(Boolean).join(' ')
  const age = computeAge(birthYear)

  return (
    <View>
      <Text className="text-3xl font-bold text-brand-800">
        {`Ihr neuer ${jobTitle ?? ''} ${firstName ?? ''}`.trim()}
      </Text>
      <View className="mt-2 h-px bg-brand-200" />

      <View className="mt-4">
        {firstName && <Row label="Name" value={firstName} />}
        <Row label="Führerschein" value={hasDriverLicense ? 'Ja' : 'Nein'} />
        <Row label="PKW" value={hasCar ? 'Ja' : 'Nein'} />
        {age !== '' && <Row label="Alter" value={age} />}
        {wohnort !== '' && <Row label="Wohnort" value={wohnort} />}
        {availableFrom && <Row label="Verfügbar" value={formatDate(availableFrom)} />}
        {salaryEur != null && <Row label="Gehalt" value={`${salaryEur.toLocaleString('de-DE')} EUR`} />}
      </View>
    </View>
  )
}
